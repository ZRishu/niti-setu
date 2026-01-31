import fs from 'fs';
import PdfParse from 'pdf-parse';
import Scheme from '../models/Scheme.js';
import { splitTextIntoChunks } from '../utils/aiOrchestrator.js';
import { error } from 'console';
import { text } from 'stream/consumers';

// response for ingesting scheme pdf
export const ingestScheme = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Please upload a PDF file' });
    }

    const { schemeName, benefits, benefitsValue } = req.body;
    // extracting text from pdf
    const dataBuffer = fs.readFileSync(req.file.path);
    const data = await PdfParse(dataBuffer);
    const rawText = data.text;

    // prep chunks
    const docs = await splitTextIntoChunks(rawText);

    const textChunks = docs.map((doc) => ({
      content: doc.pageContent,
      page: 1,
    }));

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
      },
    });
  } catch (err) {
    console.error('Error ingesting scheme:', err);
    res.status(500).json({ success: false, error: error.message });
  }
};
