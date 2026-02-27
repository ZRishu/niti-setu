import { GoogleGenAI } from "@google/genai";
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import dotenv from 'dotenv';

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
export const splitTextIntoChunks = async (text) => {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });
  return await splitter.createDocuments([text]);
};

export const getEmbedding = async (text) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Google Generative AI API key is not set in environment variables.');
    }
    const response = await ai.models.embedContent({
      model: "gemini-embedding-001",
      contents: String(text),
      config: {
        outputDimensionality: 768 
      }
    });
    const vector = response.embeddings[0].values;

    console.log(`[AI Orchestrator] Generated vector dimensions: ${vector.length}`);
    
    if (vector.length !== 768) {
        throw new Error(`CRITICAL: Expected 768 dimensions, got ${vector.length}`);
    }
    return vector;

  } catch (error) {
    console.error("Embedding Error:", error);
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

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt
    });
    const jsonString = response.text.replace(/```json|\n```/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Scheme Details Extraction Error:", error);
    return {
      state: "Pan-India", gender: "All", caste: "All", benefits_type: "Service", max_value: 0 
    };
  }
};

export const generateAnswer = async (userQuery, contextChunks) => {
  try {
    
    const hasContext = contextChunks && contextChunks.length > 0;
    const contextString = hasContext ? contextChunks.join("\n\n") : "No specific scheme documents found.";
    const prompt = `
      You are Niti-Setu, a helpful government scheme AI assistant. 
      
      User Question: "${userQuery}"

      Local Database Context:
      ${contextString}

      Instructions:
      1. If Local Database Context is provided, answer the user's question using ONLY that context.
      2. If no Local Database Context is provided AND the user is just greeting you or making small talk, respond politely as an AI assistant.
      3. If no Local Database Context is provided AND the user is asking a specific question about a scheme or policy, USE YOUR GOOGLE SEARCH TOOL to find the latest, accurate information from the internet and answer the question. Start your answer by politely letting the user know you are providing this information from the web.
    `;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }]
        }
    });
    return response.text;                  
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

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt
    });
    const jsonString = response.text.replace(/```json|\n```/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonString);
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
    "${schemeText.substring(0,3000)}"
    
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

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt
    });
    const text = response.text.replace(/```json|```/g, "").trim();
    return JSON.parse(text);
  }
  catch(error){
    console.log("Eligibility Check Error:", error);
    return {isEligible: false , reason: "Error analyzing rules", citation: "N/A", documents_required: []}
  }
};

// smart recommendation query generator 
export const generateProfileQuery = async (userProfile) => {
  const { state , gender , caste , occupation , age } = userProfile;
  return `Government schemes for ${gender || ''} ${occupation || 'citizens'} in ${state || 'India'} ${caste ? `category ${caste}` : ''}`;
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

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt
    });
    const jsonString = response.text.replace(/```json|\n```/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonString);
  }
  catch(error){
    console.error("Profile Extraction Error:", error);
    throw new Error("Failed to extract profile from text");
  }
}
