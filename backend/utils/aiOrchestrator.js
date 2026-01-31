import { GoogleGenerativeAIEmbeddings } from "langchain/googlegenai";
import {RecursiveCharacterTextSplitter} from "langchain/text_splitter";
import dotenv from "dotenv";

dotenv.config();

const embeddings = new GoogleGenerativeAIEmbeddings({
    model: "text-embedding-004",
    taskType: "retrieval_document",
    apiKey: process.env.GOOGLE_GENAI_API_KEY
});

export const splitTextIntoChunks = async (text) => { 
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
    });
    return await splitter.createDocuments([text]);
    
}

export const getEmbeddings = async (text) => {
    return await embeddings.embedQuery(text);
}