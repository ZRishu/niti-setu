import fs from 'fs';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import Scheme from '../models/Scheme.js';
import { getEmbedding, splitTextIntoChunks ,extractSchemeDetails, generateAnswer, checkEligibility,checkEligibilityWithCitations, generateProfileQuery} from '../utils/aiOrchestrator.js';
import { extractProfileFromText } from '../utils/aiOrchestrator.js';
import Analytics from '../models/Analytics.js';

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
    const chunksToInsert = []

    for(let i = 0 ; i < rawChunks.length ; i++){
      const pageContent = rawChunks[i];
      // format is "1---\nActual Content..."

      const pageNum = pageContent.split('---')[0].trim();
      const cleanContent = pageContent.split('---')[1];

      if(cleanContent && cleanContent.length > 50){
        // For better granular search , we should split large pages into smaller chunks
        // using splitter utility logic

        const splitDocs = await splitTextIntoChunks(cleanContent);

        for(const doc of splitDocs){
          const vector = await getEmbedding(doc.pageContent, "document");
          chunksToInsert.push({
            name: schemeName,
            benefits: {
              type: benefitsType || aiMetadata.benefits_type || 'Service',
              max_value_inr: aiMetadata.max_value || benefitsValue || 0,
              description: `Ingested from ${req.file.originalname}`,
            },
            filters: {
              state: [aiMetadata.state || 'Pan-India'],
              gender: [aiMetadata.gender || 'All'],
              caste: [aiMetadata.caste || 'All'],
            },  
            original_pdf_url: req.file.path,
            snippet: doc.pageContent,
            vector: vector,
            page_number: parseInt(pageNum) || 1
          });
        }

      }
    }
    
    await Scheme.deleteMany({ name: schemeName }); // remove old scheme with same name if exists
    await Scheme.insertMany(chunksToInsert);  
    fs.unlinkSync(req.file.path);

    res.status(201).json({
      success: true,
      data: {
        // scheme._id removed, because we inserted MANY chunks, not one scheme.
        name: schemeName,
        extracted_metadata: aiMetadata,
        chunks_processed: chunksToInsert.length, // Fixed variable name
        message: 'Scheme ingested successfully with flattened vectors generated.',
      },
    });
  } catch (err) {
    //if ingestion fails pdf is deleted to avoid memory leak
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.log(`Error ingesting scheme:` , err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// vector search
export const searchSchemes = async (req, res) => {
  try {
    const { query, userProfile } = req.body;
    if (!query) return res.status(400).json({ success: false, error: 'Query parameter is required' });

    const rawVector = await getEmbedding(query);
    const queryVector = Array.from(rawVector);

    let searchFilter = {};
    if (userProfile && Object.keys(userProfile).length > 0) {
      const conditions = [];
      if (userProfile.state) conditions.push({ 'filters.state': { $in: [userProfile.state, 'Pan-India', 'All India', 'All'] } });
      if (userProfile.gender) conditions.push({ 'filters.gender': { $in: [userProfile.gender, 'All', 'Both'] } });
      if (userProfile.socialCategory) conditions.push({ 'filters.caste': { $in: [userProfile.socialCategory, 'General', 'All'] } });
      if (conditions.length > 0) searchFilter = { $and: conditions };
    }

    const vectorSearchStage = {
      index: 'vector_index',
      path: 'vector',
      queryVector: queryVector,
      numCandidates: 50,
      limit: 5
    };

    if (Object.keys(searchFilter).length > 0) {
      vectorSearchStage.filter = searchFilter;
    }

    const results = await Scheme.aggregate([
      { $vectorSearch: vectorSearchStage },
      { $set: { searchScore: { $meta: 'vectorSearchScore' } } }, 
      { $group: {
          _id: "$name",
          docId: { $first: "$_id" },
          name: { $first: "$name" },
          benefits: { $first: "$benefits" },
          score: { $max: "$searchScore" },
          snippet: { $first: "$snippet" },
          page_number: { $first: "$page_number" }
      }},
      { $sort: { score: -1 } }
    ]);

    const enhancedResults = await Promise.all(results.map(async (scheme) => {
        if (userProfile && Object.keys(userProfile).length > 0) {
            const aiDecision = await checkEligibilityWithCitations(userProfile, scheme.snippet);
            return { ...scheme, _id: scheme.docId, eligibility: aiDecision }; // remap _id for frontend
        }
        return { ...scheme, _id: scheme.docId };
    }));

    res.status(200).json({ success: true, count: enhancedResults.length, data: enhancedResults });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

//GET all schemes
export const getAllSchemes = async (req, res) => {
  try {
    const schemes = await Scheme.aggregate([
      { 
        $group: {
          _id: "$name",
          id: { $first: "$_id" },
          name: { $first: "$name" },
          filters: { $first: "$filters" },
          createdAt: { $first: "$createdAt" },
          original_pdf_url: { $first: "$original_pdf_url" }
        }
      },
      { $sort: { createdAt: -1 } }
    ]);
    res.json({ success: true, data: schemes });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// RAG
export const chatWithScheme = async (req, res) => {
  try {
    const { query, userProfile } = req.body;

    if (!query) return res.status(400).json({success: false, error: 'Query parameter is required'});
    
    const rawVector = await getEmbedding(query);
    const queryVector = Array.from(rawVector);
    let searchFilter = {}


    if(userProfile && Object.keys(userProfile).length > 0 ) {
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

    const vectorSearchStage = {
      index: 'vector_index',
      path: 'vector',
      queryVector: queryVector,
      numCandidates: 50,
      limit: 3
    };

    if (Object.keys(searchFilter).length > 0) vectorSearchStage.filter = searchFilter;

    const searchResults = await Scheme.aggregate([
      { $vectorSearch: vectorSearchStage },
      { $project: { snippet: 1, page: "$page_number" } } 

    ]);

    if (searchResults.length === 0) {
      // Pass an empty array to the AI so it can just respond to the greeting
      const casualAnswer = await generateAnswer(query, []);
      return res.json({ success: true, answer: casualAnswer, sources: [] });
    }
    
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
  const startTime = Date.now();
  try{
    const {schemeId , userProfile } = req.body;

    if(!schemeId || !userProfile){
      return res.status(400).json({success: false , error: "Scheme ID and profile required"});
    }

    const singleChunk = await Scheme.findById(schemeId);
    if(!singleChunk){
      return res.status(404).json({success: false, error: "Scheme not found"})
    }

    // 2. Fetch ALL chunks that share the same Scheme Name
    const allChunks = await Scheme.find({ name: singleChunk.name });

    // 3. Combine their text (using 'snippet', not 'content')
    const fullRules = allChunks.map(c => c.snippet).join("\n");

    const analysis = await checkEligibility(fullRules , userProfile);

    const endTime = Date.now()

    await Analytics.create({ 
      eventType: 'eligibility_check',
      responseTimeMs: endTime - startTime
    });

    res.json({
      success: true,
      scheme_name: singleChunk.name,
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
    const rawVector = await getEmbedding(searchQuery, "query");
    const queryVector = Array.from(rawVector);

    // vector search

    const pipeline = [
      {
                $vectorSearch: {
                    index: "vector_index",
                    path: "vector",
                    queryVector: queryVector,
                    numCandidates: 100,
                    limit: 10,
                    filter: {
                        $and: [
                            { "filters.state": { $in: [userProfile.state || "All", "Pan-India", "All"] } },
                            { "filters.gender": { $in: [userProfile.gender || "All", "All", "Both"] } },
                            { "filters.caste": { $in: [userProfile.caste || userProfile.socialCategory || "All", "General", "All"] } }
                        ]
                    }
                }
            },

            { $set: { searchScore: { $meta: 'vectorSearchScore' } } },

           {
          $group: {
              _id: "$name",
              docId: { $first: "$_id" },
              name: { $first: "$name" },
              benefits: { $first: "$benefits" },
              score: { $max: "$searchScore" },
              proof_text: { $first: "$snippet" },
              page_number: { $first: "$page_number" }
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

// parse voice text into profile
export const parseVoiceProfile = async(req , res) => {
  try{
    const { spokenText } = req.body;

    if(!spokenText){
      return res.status(400).json({success: false, error: "Spoken text is required" })
    }
    
    console.log(` Processing Voice Text: "${spokenText}"`);

    // Ai converts english hindi to json profile
    const structuredProfile = await extractProfileFromText(spokenText);

    res.status(200).json({
      success: true,
      message: "Profile extracted successfully",
      profile: structuredProfile
    });
  }
  catch(err){
    res.status(500).json({ success: false, error: err.message });
  }
};


// Get impact metrics for dashboard
export const getDashboardMetrics = async (req , res) => {
  try{
    const uniqueSchemes = await Scheme.distinct("name");
    //count totalSchemes in system
    const schemesAnalyzed = uniqueSchemes.length;

    // checksPerformed count
    const checksPerformed = await Analytics.countDocuments({eventType: 'eligibility_check' })

    // calculating average response time
    const timeData = await Analytics.aggregate([
      {$match : { eventType: 'eligibility_check' }},
      { $group: {_id: null , averageTime: { $avg: "$responseTimeMs" }}}
    ]);

    // format milliseconds to seconds
    let avgTimeSeconds = 0;
    if(timeData.length > 0){
      avgTimeSeconds = (timeData[0].averageTime / 1000).toFixed(2);
    }

    res.status(200).json({
      success: true,
      data: {
        schemes_analyzed : schemesAnalyzed,
        eligibility_checks_performed: checksPerformed,
        average_response_time_seconds: `${avgTimeSeconds}s`
      }
    });
  }
  catch(err){
    res.status(500).json({success: false, error: err.message});
  }
};
