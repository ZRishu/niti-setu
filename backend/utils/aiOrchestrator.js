import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import dotenv from 'dotenv';

dotenv.config();

export const splitTextIntoChunks = async (text) => {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });
  return await splitter.createDocuments([text]);
};

export const getEmbedding = async (text) => {
  const embeddings = new GoogleGenerativeAIEmbeddings({
    model: 'text-embedding-004',
    taskType: 'retrieval_document',
    apiKey: process.env.GOOGLE_GENAI_API_KEY,
  });
  return await embeddings.embedQuery(text);
};
