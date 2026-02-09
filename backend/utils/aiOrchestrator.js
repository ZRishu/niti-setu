import { GoogleGenerativeAI } from "@google/generative-ai";
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import dotenv from 'dotenv';

dotenv.config();

// 1. Initialize Google AI Client
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

    // 2. Select the Embedding Model
    const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

    // 3. Generate Embedding
    const result = await model.embedContent(text);
    
    // 4. Return the vector array
    return result.embedding.values;

  } catch (error) {
    console.error("Embedding Error:", error);
    throw error;
  }
};