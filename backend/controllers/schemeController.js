import fs from 'fs';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import Scheme from '../models/Scheme.js';
import { getEmbedding, splitTextIntoChunks ,extractSchemeDetails, generateAnswer, checkEligibilityWithCitations} from '../utils/aiOrchestrator.js';

export const ingestScheme = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Please upload a PDF file' });
    }

    const { schemeName, benefitsType, benefitsValue } = req.body;
    const dataBuffer = fs.readFileSync(req.file.path);
    const data = await pdfParse(dataBuffer);
    const rawText = data.text;

    console.log('Extracting MetaData using gemini');
    const aiMetadata = await extractSchemeDetails(rawText);
    console.log('Extracted:', aiMetadata);

    const docs = await splitTextIntoChunks(rawText);

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

    const stateFilter = aiMetadata.state || 'Pan-India';
    const genderFilter = aiMetadata.gender || 'All';
    const casteFilter = aiMetadata.caste || 'All';

    const scheme = await Scheme.create({
      name: schemeName,
      benefits: {
        type: benefitsType || aiMetadata.benefits_type || 'Service',
        max_value_inr: aiMetadata.max_value || benefitsValue || 0,
        description: 'Ingested from PDF',
      },
      filters: {
        state: [stateFilter],
        gender: [genderFilter],
        caste: [casteFilter],
      },  
      original_pdf_url: req.file.path,
      text_chunks: textChunks,
    });

    fs.synclinkSync(req.file.path);

    res.status(201).json({
      success: true,
      data: {
        id: scheme._id,
        name: scheme.name,
        extracted_metadata: aiMetadata,
        chunks_processed: textChunks.length,
        message: 'Scheme ingested extracted metadata successfully and vectors generated.',
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const searchSchemes = async (req, res) => {
  try {
    const { query, userProfile } = req.body;
    if (!query) return res.status(400).json({ success: false, error: 'Query parameter is required' });

    const queryVector = await getEmbedding(query);

    let searchFilter = {};
    if (userProfile) {
      const conditions = [];
      if (userProfile.state) conditions.push({ 'filters.state': { $in: [userProfile.state, 'Pan-India', 'All India', 'All'] } });
      if (userProfile.gender) conditions.push({ 'filters.gender': { $in: [userProfile.gender, 'All', 'Both'] } });
      if (userProfile.socialCategory) conditions.push({ 'filters.caste': { $in: [userProfile.socialCategory, 'General', 'All'] } });
      if (conditions.length > 0) searchFilter = { $and: conditions };
    }

    const results = await Scheme.aggregate([
      { $vectorSearch: { index: 'vector_index', path: 'text_chunks.vector', queryVector: queryVector, numCandidates: 50, limit: 5, filter: searchFilter } },
      { $project: { _id: 1, name: 1, benefits: 1, score: { $meta: 'vectorSearchScore' }, snippet: { $arrayElemAt: ['$text_chunks.content', 0] } } }
    ]);

    const enhancedResults = await Promise.all(results.map(async (scheme) => {
        if (userProfile) {
            const aiDecision = await checkEligibilityWithCitations(userProfile, scheme.snippet);
            return { ...scheme, eligibility: aiDecision };
        }
        return scheme;
    }));

    res.status(200).json({ success: true, count: enhancedResults.length, data: enhancedResults });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getAllSchemes = async (req, res) => {
  const schemes = await Scheme.find({}, { name: 1, filters: 1 }); 
  res.json(schemes);
};

export const chatWithScheme = async (req, res) => {
  try {
    const { query, userProfile } = req.body;
    if (!query) return res.status(400).json({success: false, error: 'Query parameter is required'});
    const queryVector = await getEmbedding(query);
    const searchResults = await Scheme.aggregate([
      { $vectorSearch: { index: 'vector_index', path: 'text_chunks.vector', queryVector: queryVector, numCandidates: 50, limit: 3 } },
      { $project: { snippet: { $arrayElemAt: ['$text_chunks.content', 0] } } }
    ]);
    if (searchResults.length === 0) return res.json({ success: true, answer: 'No schemes found.', sources: [] });
    const contextChunks = searchResults.map(doc => doc.snippet);
    const answer = await generateAnswer(query, contextChunks);
    res.json({ success: true, answer: answer, sources: searchResults.map(s => s._id) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}