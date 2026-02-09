export const searchSchemes = async (req, res) => {
  try {
    const { query, userProfile } = req.body;

    if (!query) {
      return res.status(400).json({ success: false, error: 'Query parameter is required' });
    }

    console.log(`🔍 Searching for: "${query}"`);
    if (userProfile) console.log("👤 User Profile:", userProfile);

    // Convert User Query -> Vector
    const queryVector = await getEmbedding(query);

    //Build Dynamic Filter
    let searchFilter = {};

    if (userProfile) {
      const conditions = [];

      // State Filter: User's State OR "Pan-India" schemes
      if (userProfile.state) {
        conditions.push({
          "filters.state": { $in: [userProfile.state, "Pan-India"] }
        });
      }

      // Gender Filter: User's Gender OR "All"
      if (userProfile.gender) {
        conditions.push({
          "filters.gender": { $in: [userProfile.gender, "All"] }
        });
      }

      // Caste Filter: User's Caste OR "General" OR "All"
      if (userProfile.caste) {
        conditions.push({
          "filters.caste": { $in: [userProfile.caste, "General", "All"] }
        });
      }

      // Combine all conditions with "AND" logic
      if (conditions.length > 0) {
        searchFilter = { $and: conditions };
      }
    }

    // Run Vector Search Pipeline
    const results = await Scheme.aggregate([
      {
        $vectorSearch: {
          "index": "vector_index",
          "path": "text_chunks.vector",
          "queryVector": queryVector,
          "numCandidates": 50,
          "limit": 5,
          "filter": searchFilter 
        }
      },
      {
        $project: {
          "_id": 1,
          "name": 1,
          "benefits": 1,
          "score": { "$meta": "vectorSearchScore" },
          "snippet": { "$arrayElemAt": ["$text_chunks.content", 0] },
        }
      }
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