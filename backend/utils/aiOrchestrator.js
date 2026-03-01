const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.1-8b-instant";

const safeJsonParse = (value, fallback) => {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const groqChat = async ({ prompt, system, responseFormat = null, temperature = 0.1 }) => {
  const apiKey = Bun.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is required");

  const body = {
    model: GROQ_MODEL,
    messages: [
      ...(system ? [{ role: "system", content: system }] : []),
      { role: "user", content: prompt }
    ],
    temperature
  };

  if (responseFormat) {
    body.response_format = responseFormat;
  }

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`Groq request failed: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
};

export const splitTextIntoChunks = async (text) => {
  const chunkSize = 1000;
  const overlap = 200;
  const chunks = [];

  if (!text) return chunks;

  let index = 0;
  while (index < text.length) {
    const end = Math.min(index + chunkSize, text.length);
    chunks.push({ pageContent: text.slice(index, end).trim() });

    if (end === text.length) break;
    index = end - overlap;
    if (index < 0) index = 0;
  }

  return chunks;
};

export const getEmbedding = async (text) => {
  const apiKey = Bun.env.JINA_API_KEY;
  if (!apiKey) throw new Error("JINA_API_KEY is not set in environment variables.");

  const response = await fetch("https://api.jina.ai/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "jina-embeddings-v2-base-en",
      input: [String(text)]
    })
  });

  if (!response.ok) {
    throw new Error(`Jina embedding request failed: ${response.status}`);
  }

  const data = await response.json();
  const vector = data?.data?.[0]?.embedding;
  if (!Array.isArray(vector)) {
    throw new Error("Invalid embedding response");
  }

  return vector;
};

export const extractSchemeDetails = async (text) => {
  const prompt = `Analyze the following government scheme document text and extract structured data.
Return ONLY a JSON object with these fields:
- state: specific Indian state or Pan-India
- gender: Male, Female, or All
- caste: SC, ST, OBC, General, or All
- benefits_type: Financial, Subsidy, Insurance, or Service
- max_value: numeric max financial benefit, else 0

Text Snippet: "${text.substring(0, 4000)}"`;

  try {
    const result = await groqChat({ prompt, responseFormat: { type: "json_object" }, temperature: 0 });
    return safeJsonParse(result, {
      state: "Pan-India",
      gender: "All",
      caste: "All",
      benefits_type: "Service",
      max_value: 0
    });
  } catch {
    return {
      state: "Pan-India",
      gender: "All",
      caste: "All",
      benefits_type: "Service",
      max_value: 0
    };
  }
};

export const generateAnswer = async (userQuery, contextChunks) => {
  const contextString = contextChunks && contextChunks.length > 0
    ? contextChunks.join("\n\n")
    : "No scheme context found in the database for this query.";

  const prompt = `You are Niti-Setu, a helpful government scheme AI assistant.

User Question: "${userQuery}"

Context:
${contextString}

Answer clearly, in simple language, and include concise supporting citations from context.`;

  try {
    return await groqChat({
      prompt,
      system: "You are Niti-Setu, a helpful government scheme assistant. Use provided context only.",
      temperature: 0.1
    });
  } catch {
    return "Sorry, I'm having trouble generating an answer right now. Please try again later.";
  }
};

export const checkEligibilityWithCitations = async (userProfile, schemeContext) => {
  const prompt = `Analyze eligibility using the profile and scheme context.
Return ONLY a JSON object with:
- isEligible: boolean
- reason: concise explanation
- citation: exact supporting text
- benefitAmount: string

User Profile: ${JSON.stringify(userProfile)}
Scheme Context: ${schemeContext}`;

  try {
    const result = await groqChat({
      prompt,
      system: "You are a strict eligibility engine. Missing criteria means not eligible.",
      responseFormat: { type: "json_object" },
      temperature: 0
    });

    return safeJsonParse(result, {
      isEligible: false,
      reason: "Could not determine eligibility at this time.",
      citation: "",
      benefitAmount: "N/A"
    });
  } catch {
    return {
      isEligible: false,
      reason: "Could not determine eligibility at this time.",
      citation: "",
      benefitAmount: "N/A"
    };
  }
};

export const checkEligibility = async (schemeText, userProfile) => {
  const prompt = `You are a strict government eligibility officer.
Scheme Rules:
"${schemeText.substring(0, 10000)}"
Applicant Profile:
${JSON.stringify(userProfile)}

Return ONLY a JSON object with keys:
- isEligible
- reason
- missing_criteria
- citation
- documents_required`;

  try {
    const result = await groqChat({
      prompt,
      system: "You are a strict and consistent eligibility engine. No assumptions allowed.",
      responseFormat: { type: "json_object" },
      temperature: 0
    });

    return safeJsonParse(result, {
      isEligible: false,
      reason: "Error analyzing rules",
      missing_criteria: [],
      citation: "N/A",
      documents_required: []
    });
  } catch {
    return {
      isEligible: false,
      reason: "Error analyzing rules",
      missing_criteria: [],
      citation: "N/A",
      documents_required: []
    };
  }
};

export const generateProfileQuery = async (userProfile) => {
  const { state, gender, occupation, caste, socialCategory } = userProfile;
  const category = caste || socialCategory || "";
  return `Government schemes for ${gender || ""} ${occupation || "citizens"} in ${state || "India"} ${category ? `category ${category}` : ""}`;
};

export const extractProfileFromText = async (rawText) => {
  const prompt = `Extract farmer details from the text (Hindi/English/mixed) and standardize to English.
Return ONLY JSON with keys:
- state
- district
- land_holding_acres
- crop_type
- caste (General/OBC/SC/ST/All)

Text: "${rawText}"`;

  try {
    const result = await groqChat({ prompt, responseFormat: { type: "json_object" }, temperature: 0 });
    return safeJsonParse(result, {
      state: null,
      district: null,
      land_holding_acres: null,
      crop_type: null,
      caste: null
    });
  } catch {
    throw new Error("Failed to extract profile from text");
  }
};
