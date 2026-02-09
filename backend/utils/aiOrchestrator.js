import { GoogleGenerativeAI } from "@google/generative-ai";
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import dotenv from 'dotenv';

dotenv.config();

//  Initialize Google AI Client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Helper: Turn text into chunks
export const splitTextIntoChunks = async (text) => {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });
  return await splitter.createDocuments([text]);
};

// Helper: Get Vector for a single string using Official SDK
export const getEmbedding = async (text) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Google Generative AI API key is not set in environment variables.');
    }

    // Select the Embedding Model
    const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

    //  Generate Embedding
    const result = await model.embedContent(text);
    
    //Return the vector array
    return result.embedding.values;

  } catch (error) {
    console.error("Embedding Error:", error);
    throw error;
  }
};

export const extractSchemeDetails = async (text) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    const prompt = `
    Analyze the following government scheme document text and extract structured data.
      Return ONLY a JSON object (no markdown) with these fields:
      - state: The specific Indian state mentioned (e.g., "Maharashtra", "Delhi"). If it applies to all of India, return "Pan-India".
      - gender: "Male", "Female", or "All".
      - caste: "SC", "ST", "OBC", "General", or "All".
      - benefits_type: "Financial", "Subsidy", "Insurance", or "Service".
      - max_value: The maximum financial benefit in numbers (e.g., 50000). If not mentioned, return 0.

      Text Snippet: "${text.substring(0, 3000)}" 
    `;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    // cleaning response to ensure it's valid JSON
    const jsonString = response.replace(/```json|```/g, '').trim();
    retunr JSON.parse(jsonString);

  } catch (error) {
    console.error("Scheme Details Extraction Error:", error);
    return {
      state: "Pan-India",gender: "All", caste: "All", benefits_type: "Service", max_value: 0 
    };
  }
};

    
