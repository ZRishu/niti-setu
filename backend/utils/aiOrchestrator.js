import { GoogleGenerativeAI } from "@google/generative-ai";
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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
    const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    console.error("Embedding Error:", error);
    throw error;
  }
};

export const extractSchemeDetails = async (text) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const prompt = `Analyze the following government scheme document text and extract structured data.
      Return ONLY a JSON object (no markdown) with these fields:
      - state: The specific Indian state mentioned (e.g., "Maharashtra", "Delhi"). If it applies to all of India, return "Pan-India".
      - gender: "Male", "Female", or "All".
      - caste: "SC", "ST", "OBC", "General", or "All".
      - benefits_type: "Financial", "Subsidy", "Insurance", or "Service".
      - max_value: The maximum financial benefit in numbers (e.g., 50000). If not mentioned, return 0.

      Text Snippet: "${text.substring(0, 4000)}"`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();
    const jsonString = response.replace(/```json|\n```/g, '').replace(/```/g, '').trim();
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
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `
      You are a helpful government scheme assistant. 
      Answer the user's question using ONLY the provided context information below.
      If the answer is not in the context, politely say you don't know.
      Keep the answer concise, accurate, and easy to understand.

      User Question: "${userQuery}"

      Context Information:
      ${contextChunks.join("\n\n")}
    `;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Answer Generation Error:", error);
    return "Sorry, I'm having trouble generating an answer right now. Please try again later.";
  }
};

export const checkEligibilityWithCitations = async (userProfile, schemeContext) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
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

    const result = await model.generateContent(prompt);
    const response = result.response.text();
    const jsonString = response.replace(/```json|\n```/g, '').replace(/```/g, '').trim();
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

// eligibilty check yes or a no
export const checkEligibility = async (schemeText , userProfile) => {
  try{
    const model = genAI.getGenerativeModel({model : "gemini-2.5-flash"});

    const prompt = `
    You are a strict government eligibility officer.
    Analyze the scheme rules below and compare them with the applicant's profile.
    
    Scheme Rules:
    "${schemeText.substring(0,3000)}"
    
    Applicant Profile: 
    ${JSON.stringify(userProfile)}
    
    Task:
      Determine if the applicant is eligible.
      Return ONLY a JSON object (no markdown) with this structure:
      {
        "isEligible": boolean,
        "reason": "Clear explanation of why (e.g., 'Land holding is 5 acres, but limit is 2 acres')",
        "missing_criteria": ["List specific requirements they failed, if any"],
        "citation": "Quote the exact sentence from the text that proves this rule"
      }
    `

    const result = await model.generateContent(prompt)
    const text = result.response.text().replace(/```json|```/g, "").trim();
    return JSON.parse(text);
  }
  catch(error){
    console.log("Eligibility Check Error:", error);
    return {isEligible: false , reason: "Error analyzing rules", citation: "N/A"}
  }
};

// smart recommendation query generator 
export const generateProfileQuery = async (userProfile) => {
  const { state , gender , caste , occupation , age } = userProfile;
  return `Government schemes for ${gender || ''} ${occupation || 'citizens'} in ${state || 'India'} ${caste ? `category ${caste}` : ''}`;
}
