import fs from 'fs';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import Scheme from '../models/Scheme.js';
import { getEmbedding, splitTextIntoChunks } from '../utils/aiOrchestrator.js';

// response for ingesting scheme pdf
export const ingestScheme = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Please upload a PDF file' });
    }

    const { schemeName, benefitsType, benefitsValue } = req.body;
    // extracting text from pdf
    const dataBuffer = fs.readFileSync(req.file.path);
    const data = await pdfParse(dataBuffer);
    const rawText = data.text;

    // prep chunks
    const docs = await splitTextIntoChunks(rawText);

    console.log(`Generating embeddings for ${docs.length} chunks...`);

    const textChunks = await Promise.all(
      docs.map(async (doc) => {
        const vector = await getEmbedding(doc.pageContent);
        return {
          content: doc.pageContent,
          vector: vector,
          page: 1,
        };
      })
    );

    //saving into mongodb
    const scheme = await Scheme.create({
      name: schemeName,
      benefits: {
        type: benefitsType || 'Financial',
        max_value_inr: benefitsValue || 0,
        description: `Ingested from ${req.file.originalname}`,
      },
      original_pdf_url: req.file.path,
      text_chunks: textChunks,
    });

    fs.unlinkSync(req.file.path); // delete the file after processing

    res.status(201).json({
      success: true,
      data: {
        id: scheme._id,
        name: scheme.name,
        chunks_processed: textChunks.length,
        message: 'Scheme ingested and processed successfully and vectors generated.',
      },
    });
  } catch (err) {
    console.error('Error ingesting scheme:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

export const searchSchemes = async(req , res) => {
  try {
    const {query} = req.query;
    
}
