import express from 'express';
import multer from 'multer';
import { ingestScheme } from '../controllers/schemeController.js';

const router = express.Router();

const upload = multer({ dest: 'uploads/' });

/**
 * @swagger
 * /schemes/ingest:
 * post:
 * summary: Upload and process a Scheme PDF
 * consumes:
 * - multipart/form-data
 * parameters:
 * - in: formData
 * name: pdf
 * type: file
 * required: true
 * - in: formData
 * name: schemeName
 * type: string
 * required: true
 * responses:
 * 201:
 * description: Scheme processed successfully
 */

router.post('/ingest', upload.single('pdf'), ingestScheme);

export default router;