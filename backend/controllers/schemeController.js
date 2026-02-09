import fs from 'fs';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import Scheme from '../models/Scheme.js';
import { getEmbedding, splitTextIntoChunks } from '../utils/aiOrchestrator.js';
import { get } from 'http';
import { count, log } from 'console';

// response for ingesting scheme pdf
export const ingestScheme = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Please upload a PDF file' });
    }

    const { schemeName, benefitsType, benefitsValue } = req.body;
    // extracting text from pdf
    const dataBuffer = fs.readFileSync(req.file.path);
    const data = await pdfParse(dataBuffer);
    //extracting metadata using gemini
    const rawText = data.text;

    //using gemini to extract metadata and filters
    console.log(`Extracting MetaData using gemini`);
    const aiMetadata = await extractSchemeDetails(rawText);
    console.log(`Extracted:`, aiMetadata);

    // prep chunks
    const docs = await splitTextIntoChunks(rawText);

    console.log(`Generating embeddings for ${docs.length} chunks...`);

    const textChunks = await Promise.all(
      docs.map(async (doc) => {
        const vector = await getEmbedding(doc.pageContent);
        return {
          content: doc.pageContent,
          vector: vector,
          page: 1,
        };
      })
    );

    //saving into mongodb
    const scheme = await Scheme.create({
      name: schemeName,
      benefits: {
        type: benefitsType || 'Financial',
        max_value_inr: benefitsValue || 0,
        description: `Ingested from ${req.file.originalname}`,
      },
      original_pdf_url: req.file.path,
      text_chunks: textChunks,
    });

    fs.unlinkSync(req.file.path); // delete the file after processing

    res.status(201).json({
      success: true,
      data: {
        id: scheme._id,
        name: scheme.name,
        chunks_processed: textChunks.length,
        message: 'Scheme ingested and processed successfully and vectors generated.',
      },
    });
  } catch (err) {
    console.error('Error ingesting scheme:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

export const searchSchemes = async (req, res) => {
  try {
    const { query, userProfile } = req.body;

    if (!query) {
      return res.status(400).json({ success: false, error: 'Query parameter is required' });
    }

    console.log(`🔍 Searching for: "${query}"`);
    if (userProfile) console.log('👤 User Profile:', userProfile);

    // Convert User Query -> Vector
    const queryVector = await getEmbedding(query);

    //Build Dynamic Filter
    let searchFilter = {};

    if (userProfile) {
      const conditions = [];

      // State Filter: User's State OR "Pan-India" schemes
      if (userProfile.state) {
        conditions.push({
          'filters.state': { $in: [userProfile.state, 'Pan-India'] },
        });
      }

      // Gender Filter: User's Gender OR "All"
      if (userProfile.gender) {
        conditions.push({
          'filters.gender': { $in: [userProfile.gender, 'All'] },
        });
      }

      // Caste Filter: User's Caste OR "General" OR "All"
      if (userProfile.caste) {
        conditions.push({
          'filters.caste': { $in: [userProfile.caste, 'General', 'All'] },
        });
      }

      // Combine all conditions with "AND" logic
      if (conditions.length > 0) {
        searchFilter = { $and: conditions };
      }
    }

    // 3. Run Vector Search Pipeline
    const results = await Scheme.aggregate([
      {
        $vectorSearch: {
          index: 'vector_index',
          path: 'text_chunks.vector',
          queryVector: queryVector,
          numCandidates: 50,
          limit: 5,
          filter: searchFilter,
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          benefits: 1,
          score: { $meta: 'vectorSearchScore' },
          snippet: { $arrayElemAt: ['$text_chunks.content', 0] },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      count: results.length,
      data: results,
    });
  } catch (err) {
    console.error('Error searching schemes:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};
