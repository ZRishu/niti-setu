import fs from 'fs';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import Scheme from '../models/Scheme.js';
import { getEmbedding, splitTextIntoChunks ,extractSchemeDetails, generateAnswer, checkEligibility,checkEligibilityWithCitations, generateProfileQuery} from '../utils/aiOrchestrator.js';
import { normalize } from 'path';
import { error, log } from 'console';
import { text } from 'stream/consumers';

export const ingestScheme = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Please upload a PDF file' });
    }

    const { schemeName, benefitsType, benefitsValue } = req.body;

    // read pdf with page no.s
    const dataBuffer = fs.readFileSync(req.file.path);
    
    //custom render function to inject page markers
    const render_page = (pageData) => {
      let render_options = {
        normalizeWhitespace: true,
        disabledCombineTextItems: false,
      }

      return pageData.getTextContent(render_options)
      .then(function(textContent){
        let lastY, text = '';
        for(let item of textContent.items){
          if(lastY == item.transform[5] || !lastY){
            text += item.str;
          }
          else{
            text += '\n' + item.str;
          }
          lastY = item.transform[5];
        }
        
        // inject marker ---PageNo.----
        return `---PAGE ${pageData.pageIndex + 1}---\n${text}\n`;
      })
    }

    let options = {
      pagerender: render_page
    }

    const data = await pdfParse(dataBuffer , options);
    const fullText = data.text;

    console.log('Extracting MetaData using gemini');
    // extract metadata with the first 4000 chars 
    const aiMetadata = await extractSchemeDetails(fullText.substring(0, 4000));
    console.log('Extracted:', aiMetadata);

    // process chunks with page numbers
    console.log(`Processing text chunks...`);

    // split by our custom page marker
    const rawChunks = fullText.split('---PAGE ')
    const textChunks = []

    for(let i = 0 ; i < rawChunks.length ; i++){
      const pageContent = rawChunks[i];
      // format is "1---\nActual Content..."

      const pageNum = pageContent.split('---')[0].trim();
      const cleanContent = pageContent.split('---')[1];

      if(cleanContent && cleanContent > 50){
        // For better granular search , we should split large pages into smaller chunks
        // using splitter utility logic

        const splitDocs = await splitTextIntoChunks(cleanContent);

        for(const doc of splitDocs){
          const vector = await getEmbedding(doc.pageContent);
          textChunks.push({
              content: doc.pageContent,
              vector: vector,
              page_number: parseInt(pageNum) || 1 // store the page number
          })
        }

      }
    }
    

    const stateFilter = aiMetadata.state || 'Pan-India';
    const genderFilter = aiMetadata.gender || 'All';
    const casteFilter = aiMetadata.caste || 'All';

    //smart save overwritting if exists
    const existingScheme = await Scheme.findOne({ name: schemeName });
    if(existingScheme){
      console.log(`Scheme "${schemeName}" already exists. Overwriting...`);
      await Scheme.deleteOne({ _id: existingScheme._id});
    }

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

    fs.unlinkSync(req.file.path);

    res.status(201).json({
      success: true,
      data: {
        id: scheme._id,
        name: scheme.name,
        extracted_metadata: aiMetadata,
        chunks_processed: textChunks.length,
        message: 'Scheme ingested extracted metadata successfully with page number and vectors generated.',
      },
    });
  } catch (err) {
    console.log(`Error ingesting scheme:` , err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// vector search
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

//GET all schemes
export const getAllSchemes = async (req, res) => {
  const schemes = await Scheme.find({}, { name: 1, filters: 1 }); 
  res.json(schemes);
};

// RAG
export const chatWithScheme = async (req, res) => {
  try {
    const { query, userProfile } = req.body;

    if (!query) return res.status(400).json({success: false, error: 'Query parameter is required'});
    
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
          "limit": 3, 
          "filter": searchFilter 
        }
      },
      {
        $project: {
          "snippet": { "$arrayElemAt": ["$text_chunks.content", 0] },
          "page": { "$arrayElemAt": ["$text_chunks.page_number", 0] }
        }
      }
    ]);


    if (searchResults.length === 0)
       return res.json({ success: true, answer: 'No schemes found.', sources: [] });
    
    const contextChunks = searchResults.map(doc => doc.snippet);
    const answer = await generateAnswer(query, contextChunks);

    res.json({
      success: true,
      answer: answer,
      sources: searchResults.map(s => ({ id: s._id, page: s.page })) 
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// check strict eligibility 
export const checkSchemeEligibility = async( req , res) => {
  try{
    const {schemeId , userProfile } = req.body;

    if(!schemeId || !userProfile){
      return res.status(400).json({success: false , error: "Scheme ID and profile required"});
    }

    // get scheme text
    const scheme = await Scheme.findById(schemeId);
    if(!scheme){
      return res.status(404).json({success: false, error: "Scheme not found"})
    }

    //Combine all text chunks to give AI the full context (limit to ~3000 chars for speed)
        // prioritize chunks that contain "eligibility" keywords if possible, 

    const fullRules = scheme.text_chunks.map(c => c.content).join("\n");

    const analysis = await checkEligibility(fullRules , userProfile);

    res.json({
      success: true,
      scheme_name: scheme.name,
      result: analysis
    });
        
  }
  catch(err){
    res.status(500).json({success: false, error: err.message});
  }
};


// smart recommendations 
export const getRecommendedSchemes = async( req , res) => {
  try{
    const {userProfile} = req.body;

    if(!userProfile){
      return res.status(400).json({ success: false, error: "User Profile is required" });
    }

    // generating search string for profile
    const searchQuery = await generateProfileQuery(userProfile);
    const queryVector = await getEmbedding(searchQuery);

    // vector search

    const pipeline = [
      {
                $vectorSearch: {
                    index: "vector_index",
                    path: "text_chunks.vector",
                    queryVector: queryVector,
                    numCandidates: 100,
                    limit: 10,
                    filter: {
                        $and: [
                            { "filters.state": { $in: [userProfile.state, "Pan-India", "All"] } },
                            { "filters.gender": { $in: [userProfile.gender, "All", "Both"] } }
                        ]
                    }
                }
            },

           {
                $project: {
                    name: 1,
                    "benefits": 1,
                    score: { $meta: "vectorSearchScore" }
                }
            }, 
            // group by scheme name to remove duplicates from same scheme
            {
                $group: {
                    _id: "$_id",
                    name: { $first: "$name" },
                    benefits: { $first: "$benefits" },
                    score: { $max: "$score" }
                }
            },
            { $sort: { score: -1 } },
            { $limit: 5 }
    ]

    const recommendations = await Scheme.aggregate(pipeline);

    res.json({
      success: true,
      query_used: searchQuery,
      count: recommendations.length,
      data: recommendations
    });
  }

  catch(err){
    res.status(500).json({ success: false, error: err.message });
  }
}
