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
 * tags: [Schemes]
 * requestBody:
 * required: true
 * content:
 * multipart/form-data:
 * schema:
 * type: object
 * properties:
 * pdf:
 * type: string
 * format: binary
 * schemeName:
 * type: string
 * benefitsValue:
 * type: integer
 * responses:
 * 201:
 * description: Scheme processed successfully
 * 500:
 * description: Server error
 */
router.post('/ingest', upload.single('pdf'), ingestScheme);

export default router;