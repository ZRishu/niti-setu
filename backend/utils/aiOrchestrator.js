import Groq from "groq-sdk";
import { VoyageAIClient } from "voyageai";
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const GROQ_MODEL = "llama-3.1-8b-instant";

const performGoogleSearch = async (query) => {
  try {
    const response = await axios.post('https://google.serper.dev/search', 
      { q: query, gl: "in" }, 
      { headers: { 'X-API-KEY': process.env.SERPER_API_KEY, 'Content-Type': 'application/json' } }
    );
    // Combine top 3 snippets for context
    return response.data.organic?.slice(0, 3).map(res => `${res.title}: ${res.snippet}`).join("\n") || null;
  } catch (error) {
    console.error("Search API Error:", error);
    return null;
  }
};

export const splitTextIntoChunks = async (text) => {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });
  return await splitter.createDocuments([text]);
};

export const getEmbedding = async (text) => {
  try {
    const apiKey = process.env.JINA_API_KEY;
    if (!apiKey) {
      throw new Error('JINA AI API key is not set in environment variables.');
    }
    const response = await axios.post(
      'https://api.jina.ai/v1/embeddings',
      {
        model: 'jina-embeddings-v2-base-en',
        input: [String(text)],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.JINA_API_KEY}`,
        },
      }
    );

    const vector = response.data.data[0].embedding;

    console.log(`[AI Orchestrator] Generated vector dimensions: ${vector.length}`);
    
    if (vector.length !== 768) {
        throw new Error(`CRITICAL: Expected 768 dimensions, got ${vector.length}`);
    }
    return vector;

  } catch (error) {
    console.error("Jina AI Embedding Error:", error);
    throw error;
  }
};

export const extractSchemeDetails = async (text) => {
  try {
    
    const prompt = `Analyze the following government scheme document text and extract structured data.
      Return ONLY a JSON object (no markdown) with these fields:
      - state: The specific Indian state mentioned (e.g., "Maharashtra", "Delhi"). If it applies to all of India, return "Pan-India".
      - gender: "Male", "Female", or "All".
      - caste: "SC", "ST", "OBC", "General", or "All".
      - benefits_type: "Financial", "Subsidy", "Insurance", or "Service".
      - max_value: The maximum financial benefit in numbers (e.g., 50000). If not mentioned, return 0.

      Text Snippet: "${text.substring(0, 4000)}"`;

    const response = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" } // Built-in JSON forcing
    });
    
    return JSON.parse(response.choices[0].message.content);

  } catch (error) {
    console.error("Scheme Details Extraction Error:", error);
    return {
      state: "Pan-India", gender: "All", caste: "All", benefits_type: "Service", max_value: 0 
    };
  }
};

export const generateAnswer = async (userQuery, contextChunks) => {
  try {
    
   let contextString = contextChunks && contextChunks.length > 0 ? contextChunks.join("\n\n") : "";
    let source = "database";

    if (!contextString) {
      console.log("[AI Orchestrator] No local context found. Searching Google...");
      const searchData = await performGoogleSearch(userQuery);
      contextString = searchData || "No information found online.";
      source = "google";
    }
    const prompt = `
      You are Niti-Setu, a helpful government scheme AI assistant. 
      
      User Question: "${userQuery}"

      Local Database Context:
      ${contextString}

      Instructions:
      1. If Local Database Context is provided, answer the user's question using ONLY that context.
      2. If no Local Database Context is provided AND the user is just greeting you or making small talk, respond politely as an AI assistant.
      3. If no Local Database Context is provided AND the user is asking a specific question about a scheme or policy, USE YOUR GOOGLE SEARCH TOOL to find the latest, accurate information from the internet and answer the question. Start your answer by politely letting the user know you are providing this information from the web.
      4. Always provide a clear, concise answer in simple language that a common citizen can understand. Avoid jargon and be empathetic to the user's needs.
      5. Provide citations for any information you provide, whether from the local context or from the web. Cite the exact sentence or data point that supports your answer.
      6. Provide required documents and application process at the end of the answer if the question is about eligibility or application for a scheme.
      8. If using web search results, start by saying "Based on current information from the web...".
      9. Answer the question clearly and accurately using the context above.
    `;

    const response = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: "You are Niti-Setu, a helpful government scheme assistant. Use the provided context to answer clearly." },
        { role: "user", content: prompt }
      ],
      temperature: 0.1
    });

    return response.choices[0].message.content;

  } catch (error) {
    console.error("Answer Generation Error:", error);
    return "Sorry, I'm having trouble generating an answer right now. Please try again later.";
  }
};

export const checkEligibilityWithCitations = async (userProfile, schemeContext) => {
  try {
    const prompt = `
      Analyze the eligibility of a user based on their profile and the scheme context provided. 
      Determine if they are Eligible or Not Eligible.
      Provide a clear reason and extract the exact sentence/paragraph from the text as a citation.

      Return ONLY a JSON object with these fields:
      - isEligible: boolean
      - reason: A concise explanation
      - citation: The exact text from the document supporting this decision
      - benefitAmount: A string representing the benefit they would receive (e.g., "₹6,000/year")

      User Profile: ${JSON.stringify(userProfile)}
      Scheme Context: ${schemeContext}
    `;

    const response = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });
    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error("Eligibility Check Error:", error);
    return {
      isEligible: false,
      reason: "Could not determine eligibility at this time.",
      citation: "",
      benefitAmount: "N/A"
    };
  }
};

// eligibility check yes or a no
export const checkEligibility = async (schemeText , userProfile) => {
  try{
    const prompt = `
    You are a strict government eligibility officer.
    Analyze the scheme rules below and compare them with the applicant's profile.
    
    Scheme Rules:
    "${schemeText.substring(0,10000)}"
    
    Applicant Profile: 
    ${JSON.stringify(userProfile)}
    
    Task:
      1. Determine if the applicant is eligible.
      2. Find the exact text proving this.
      3. List the exact documents required to apply for this scheme.

      Return ONLY a JSON object (no markdown , no backticks) with this structure:
      {
        "isEligible": boolean,
        "reason": "Clear explanation of why (e.g., 'Land holding is 5 acres, but limit is 2 acres')",
        "missing_criteria": ["List specific requirements they failed, if any"],
        "citation": "Quote the exact sentence from the text that proves this rule",
        "documents_required": ["Aadhar Card", "Land Ownership Proof", "etc..."] 
      
      }
    `

    const response = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });
    return JSON.parse(response.choices[0].message.content);
  }
  catch(error){
    console.log("Eligibility Check Error:", error);
    return {isEligible: false , reason: "Error analyzing rules", citation: "N/A", documents_required: []}
  }
};

// smart recommendation query generator 
export const generateProfileQuery = async (userProfile) => {
  const { state, gender, occupation, caste, socialCategory } = userProfile;
  const category = caste || socialCategory || '';
  return `Government schemes for ${gender || ''} ${occupation || 'citizens'} in ${state || 'India'} ${category ? `category ${category}` : ''}`;
}

// Extarct sturctured profile from voice text hindi and english

export const extractProfileFromText = async(rawText) => {
  try{

    const prompt = `
    You are an AI assistant helping Indian farmers.
      Extract the farmer's details from the text below (which may be in Hindi, English, or mixed).
      Translate and standardize the extracted data into English.
      
      Return ONLY a JSON object (no markdown, no backticks) with these exact keys. 
      If a detail is missing, set its value to null.

      - state: string (e.g., "Maharashtra")
      - district: string (e.g., "Pune")
      - land_holding_acres: number (Convert bigha/hectares to acres if necessary. E.g., 2.5)
      - crop_type: string (e.g., "Cotton", "Wheat")
      - caste: string (Strictly use "General", "OBC", "SC", "ST", or "All")

      Farmer's Spoken Text: "${rawText}"
    `;

    const response = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });
    return JSON.parse(response.choices[0].message.content);
  }
  catch(error){
    console.error("Profile Extraction Error:", error);
    throw new Error("Failed to extract profile from text");
  }
}
