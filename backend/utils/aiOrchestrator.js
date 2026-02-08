import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import dotenv from 'dotenv';

dotenv.config();

//turn text into chunks
export const splitTextIntoChunks = async (text) => {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });
  return await splitter.createDocuments([text]);
};

//Get Vector for a single string
export const getEmbedding = async (text) => {

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Google Generative AI API key is not set in environment variables.');
  }
  const embeddings = new GoogleGenerativeAIEmbeddings({
    model: 'text-embedding-004',
    taskType: 'retrieval_document',
    apiKey: apiKey,
  });
  return await embeddings.embedQuery(text);
};
