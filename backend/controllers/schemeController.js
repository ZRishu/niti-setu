import fs from 'fs';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import Scheme from '../models/Scheme.js';
import { getEmbedding, splitTextIntoChunks ,extractSchemeDetails, generateAnswer} from '../utils/aiOrchestrator.js';
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

    const stateFilter = aiMetadata.state || "Pan-India";
    const genderFilter = aiMetadata.gender || "All";
    const casteFilter = aiMetadata.caste || "All";

    //saving into mongodb
    const scheme = await Scheme.create({
      name: schemeName,
      benefits: {
        type: benefitsType || aiMetadata.benefits_type || 'Service',
        max_value_inr: aiMetadata.max_value || benefitsValue || 0,
        description: `Ingested from ${req.file.originalname}`,
      },
      filters: {
        state: [stateFilter],
        gender: [genderFilter],
        caste: [casteFilter],
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
        extracted_metadata: aiMetadata,
        chunks_processed: textChunks.length,
        message: 'Scheme ingested extracted metadata successfully and vectors generated.',
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
          "filters.state": { 
            $in: [
              userProfile.state,       
              "Pan-India",            
              "Pan India",             
              "India",                 
              "Central",               
              "All India",             
              "All"                               ] 
          }
        });
      }

      // Gender Filter: User's Gender OR "All"
      if (userProfile.gender) {
        conditions.push({ 
          "filters.gender": { 
            $in: [
              userProfile.gender, 
              "All", 
              "Male",   
              "Female",
              "Women",
              "Both"
            ] 
          } 
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

export const getAllSchemes = async (req, res) => {
  // Fetch just the name and the filters field to see what's happening
  const schemes = await Scheme.find({}, { name: 1, filters: 1 }); 
  res.json(schemes);
};

// new Rag chat endpoint 
export const chatWithScheme = async (req, res) => {
  try{
    const {query, userProfilem} = req.body;

    if(!query){
      return res.status(400).json({success: false, error: "Query parameter is required"});
    }

  // resusing search logic to get relevant chunks based on query and schemeId
    const queryVector = await getEmbedding(query);
    let searchFilter = {}

    if(userProfile) {
      const conditions = [];
      
      if(userProfile.state){
        conditions.push({"filters.state": {$in: [userProfile.state, "Pan-India", "Pan India", "India", "Central", "All India", "All"]}});
      }
      if(userProfile.gender){
        conditions.push({"filters.gender": {$in: [userProfile.gender, "All", "Male", "Female", "Women", "Both"]}});
      }
      if(userProfile.caste){
        conditions.push({'filters.caste': {$in: [userProfile.caste, 'General', 'All']}});
      }
      
      if(conditions.length > 0){
        searchFilter = {$and: conditions};
      }
    }

    const searchResults = await Scheme.aggregate([
      {
        $vectorSearch: {
          "index": "vector_index",
          "path": "text_chunks.vector",
          "queryVector": queryVector,
          "numCandidates": 50,
          "limit": 3, //only need top 3 for context
          "filter": searchFilter 
        }
      },
      {
        $project: {
          "snippet": { "$arrayElemAt": ["$text_chunks.content", 0] }
        }
      }
    ]);

    if (searchResults.length === 0) {
      return res.json({ 
        success: true, 
        answer: "I couldn't find any specific schemes matching your criteria. Try broadening your search.",
        sources: []
      });
    }

    //Generate answer using gemini with retrieved chunks as context
    const contextChunks = searchResults.map(doc => doc.snippet);
    const answer = await generateAnswer(query, contextChunks);

    res.json({
      success: true,
      answer: answer,
      // return raw chunks too show on the "Sources" section of UI
      sources: searchResults.map(s => s._id) 
    });

  } catch (err) {
    console.error('Error in chatWithScheme:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}

  


