import pdfParse from "pdf-parse/lib/pdf-parse.js";
import {
  aggregateSchemes,
  deleteSchemesByName,
  distinctSchemeNames,
  findSchemeById,
  findSchemesByName,
  insertSchemes
} from "../models/Scheme.js";
import { aggregateAnalytics, countAnalyticsEvents, createAnalyticsEvent } from "../models/Analytics.js";
import {
  checkEligibility,
  checkEligibilityWithCitations,
  extractProfileFromText,
  extractSchemeDetails,
  generateAnswer,
  generateProfileQuery,
  getEmbedding,
  splitTextIntoChunks
} from "../utils/aiOrchestrator.js";
import { badRequest, json, notFound, serverError } from "../lib/http.js";

const normalizeMongoId = (value) => {
  if (!value) return value;
  if (typeof value === "string") return value;
  if (typeof value?.toString === "function") return value.toString();
  return value;
};

export const ingestScheme = async ({ request }) => {
  try {
    const formData = await request.formData();
    const pdf = formData.get("pdf");

    if (!(pdf instanceof File)) {
      return badRequest("Please upload a PDF file");
    }

    const schemeName = String(formData.get("schemeName") || "").trim();
    const benefitsType = String(formData.get("benefitsType") || "").trim();
    const benefitsValue = Number(formData.get("benefitsValue") || 0);

    if (!schemeName) {
      return badRequest("schemeName is required");
    }

    const dataBuffer = Buffer.from(await pdf.arrayBuffer());
    const data = await pdfParse(dataBuffer);
    const fullText = data?.text || "";

    if (!fullText.trim()) {
      return badRequest("Uploaded PDF has no extractable text");
    }

    const aiMetadata = await extractSchemeDetails(fullText.substring(0, 4000));

    const chunksToInsert = [];
    const splitDocs = await splitTextIntoChunks(fullText);

    for (const doc of splitDocs) {
      if (!doc.pageContent || doc.pageContent.length < 50) continue;
      const vector = await getEmbedding(doc.pageContent);

      chunksToInsert.push({
        name: schemeName,
        benefits: {
          type: benefitsType || aiMetadata.benefits_type || "Service",
          max_value_inr: aiMetadata.max_value || benefitsValue || 0,
          description: `Ingested from ${pdf.name}`
        },
        filters: {
          state: [aiMetadata.state || "Pan-India"],
          gender: [aiMetadata.gender || "All"],
          caste: [aiMetadata.caste || "All"]
        },
        original_pdf_url: pdf.name,
        snippet: doc.pageContent,
        vector,
        page_number: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    await deleteSchemesByName(schemeName);
    if (chunksToInsert.length > 0) {
      await insertSchemes(chunksToInsert);
    }

    return json(
      {
        success: true,
        data: {
          name: schemeName,
          extracted_metadata: aiMetadata,
          chunks_processed: chunksToInsert.length,
          message: "Scheme ingested successfully with flattened vectors generated."
        }
      },
      201
    );
  } catch (error) {
    return serverError(error.message || "Error ingesting scheme");
  }
};

export const searchSchemes = async ({ body }) => {
  try {
    const { query, userProfile } = body;
    if (!query) return badRequest("Query parameter is required");

    const queryVector = Array.from(await getEmbedding(query));

    const andConditions = [];
    if (userProfile && Object.keys(userProfile).length > 0) {
      if (userProfile.state) {
        andConditions.push({ "filters.state": { $in: [userProfile.state, "Pan-India", "All India", "All"] } });
      }
      if (userProfile.gender) {
        andConditions.push({ "filters.gender": { $in: [userProfile.gender, "All", "Both"] } });
      }
      const category = userProfile.caste || userProfile.socialCategory;
      if (category) {
        andConditions.push({ "filters.caste": { $in: [category, "General", "All"] } });
      }
    }

    const vectorSearchStage = {
      index: "vector_index",
      path: "vector",
      queryVector,
      numCandidates: 50,
      limit: 5
    };

    if (andConditions.length > 0) {
      vectorSearchStage.filter = { $and: andConditions };
    }

    const results = await aggregateSchemes([
      { $vectorSearch: vectorSearchStage },
      { $set: { searchScore: { $meta: "vectorSearchScore" } } },
      {
        $group: {
          _id: "$name",
          docId: { $first: "$_id" },
          name: { $first: "$name" },
          benefits: { $first: "$benefits" },
          score: { $max: "$searchScore" },
          snippet: { $first: "$snippet" },
          page_number: { $first: "$page_number" }
        }
      },
      { $sort: { score: -1 } }
    ]);

    const enhancedResults = await Promise.all(
      results.map(async (scheme) => {
        const payload = { ...scheme, _id: normalizeMongoId(scheme.docId), docId: normalizeMongoId(scheme.docId) };
        if (userProfile && Object.keys(userProfile).length > 0) {
          try {
            const aiDecision = await checkEligibilityWithCitations(userProfile, scheme.snippet);
            return { ...payload, eligibility: aiDecision };
          } catch {
            return payload;
          }
        }
        return payload;
      })
    );

    return json({ success: true, count: enhancedResults.length, data: enhancedResults });
  } catch (error) {
    return serverError(error.message || "Search failed");
  }
};

export const getAllSchemes = async () => {
  try {
    const schemes = await aggregateSchemes([
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

    const normalized = schemes.map((item) => ({ ...item, id: normalizeMongoId(item.id) }));
    return json({ success: true, data: normalized });
  } catch (error) {
    return serverError(error.message || "Failed to fetch schemes");
  }
};

export const chatWithScheme = async ({ body }) => {
  try {
    const { query, userProfile } = body;
    if (!query) return badRequest("Query parameter is required");

    const queryVector = Array.from(await getEmbedding(query));

    const andConditions = [];
    if (userProfile && Object.keys(userProfile).length > 0) {
      if (userProfile.state) {
        andConditions.push({ "filters.state": { $in: [userProfile.state, "Pan-India", "Pan India", "India", "Central", "All India", "All"] } });
      }
      if (userProfile.gender) {
        andConditions.push({ "filters.gender": { $in: [userProfile.gender, "All", "Male", "Female", "Women", "Both"] } });
      }
      const category = userProfile.caste || userProfile.socialCategory;
      if (category) {
        andConditions.push({ "filters.caste": { $in: [category, "General", "All"] } });
      }
    }

    const vectorSearchStage = {
      index: "vector_index",
      path: "vector",
      queryVector,
      numCandidates: 50,
      limit: 3
    };

    if (andConditions.length > 0) {
      vectorSearchStage.filter = { $and: andConditions };
    }

    const searchResults = await aggregateSchemes([
      { $vectorSearch: vectorSearchStage },
      { $project: { snippet: 1, page: "$page_number" } }
    ]);

    if (searchResults.length === 0) {
      const casualAnswer = await generateAnswer(query, []);
      return json({ success: true, answer: casualAnswer, sources: [] });
    }

    const contextChunks = searchResults.map((doc) => doc.snippet);
    const answer = await generateAnswer(query, contextChunks);

    return json({
      success: true,
      answer,
      sources: searchResults.map((item) => ({ id: normalizeMongoId(item._id), page: item.page }))
    });
  } catch (error) {
    return serverError(error.message || "Chat failed");
  }
};

export const checkSchemeEligibility = async ({ body }) => {
  const startTime = Date.now();

  try {
    const { schemeId, userProfile } = body;

    if (!schemeId || !userProfile) {
      return badRequest("Scheme ID and profile required");
    }

    const singleChunk = await findSchemeById(schemeId);
    if (!singleChunk) {
      return notFound("Scheme not found");
    }

    const allChunks = await findSchemesByName(singleChunk.name);
    const fullRules = allChunks.map((chunk) => chunk.snippet).join("\n");

    const analysis = await checkEligibility(fullRules, userProfile);

    await createAnalyticsEvent({
      eventType: "eligibility_check",
      responseTimeMs: Date.now() - startTime
    });

    return json({
      success: true,
      scheme_name: singleChunk.name,
      result: analysis
    });
  } catch (error) {
    return serverError(error.message || "Eligibility check failed");
  }
};

export const getRecommendedSchemes = async ({ body }) => {
  try {
    const { userProfile } = body;
    if (!userProfile) {
      return badRequest("User Profile is required");
    }

    const searchQuery = await generateProfileQuery(userProfile);
    const queryVector = Array.from(await getEmbedding(searchQuery));

    const andConditions = [];
    if (userProfile.state) {
      andConditions.push({ "filters.state": { $in: [userProfile.state, "Pan-India", "All India", "All"] } });
    }
    if (userProfile.gender) {
      andConditions.push({ "filters.gender": { $in: [userProfile.gender, "All", "Both"] } });
    }
    const category = userProfile.caste || userProfile.socialCategory;
    if (category) {
      andConditions.push({ "filters.caste": { $in: [category, "General", "All"] } });
    }

    const vectorSearchStage = {
      index: "vector_index",
      path: "vector",
      queryVector,
      numCandidates: 100,
      limit: 10
    };

    if (andConditions.length > 0) {
      vectorSearchStage.filter = { $and: andConditions };
    }

    const recommendations = await aggregateSchemes([
      { $vectorSearch: vectorSearchStage },
      { $set: { searchScore: { $meta: "vectorSearchScore" } } },
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
    ]);

    const normalized = recommendations.map((item) => ({ ...item, docId: normalizeMongoId(item.docId) }));

    return json({
      success: true,
      query_used: searchQuery,
      count: normalized.length,
      data: normalized
    });
  } catch (error) {
    return serverError(error.message || "Recommendation failed");
  }
};

export const parseVoiceProfile = async ({ body }) => {
  try {
    const { spokenText } = body;
    if (!spokenText) {
      return badRequest("Spoken text is required");
    }

    const structuredProfile = await extractProfileFromText(spokenText);

    return json({
      success: true,
      message: "Profile extracted successfully",
      profile: structuredProfile
    });
  } catch (error) {
    return serverError(error.message || "Failed to parse voice profile");
  }
};

export const getDashboardMetrics = async () => {
  try {
    const uniqueSchemes = await distinctSchemeNames();
    const schemesAnalyzed = uniqueSchemes.length;

    const checksPerformed = await countAnalyticsEvents("eligibility_check");

    const timeData = await aggregateAnalytics([
      { $match: { eventType: "eligibility_check" } },
      { $group: { _id: null, averageTime: { $avg: "$responseTimeMs" } } }
    ]);

    let avgTimeSeconds = 0;
    if (timeData.length > 0) {
      avgTimeSeconds = (timeData[0].averageTime / 1000).toFixed(2);
    }

    return json({
      success: true,
      data: {
        schemes_analyzed: schemesAnalyzed,
        eligibility_checks_performed: checksPerformed,
        average_response_time_seconds: `${avgTimeSeconds}s`
      }
    });
  } catch (error) {
    return serverError(error.message || "Failed to load dashboard metrics");
  }
};
