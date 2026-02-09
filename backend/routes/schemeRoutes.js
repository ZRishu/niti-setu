import express from 'express';
import multer from 'multer';
import { ingestScheme, searchSchemes } from '../controllers/schemeController.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

/**
 * @swagger
 * components:
 *   schemas:
 *     Scheme:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         benefits:
 *           type: object
 *           properties:
 *             type:
 *               type: string
 *             max_value_inr:
 *               type: integer
 *             description:
 *               type: string
 */

/**
 * @swagger
 * /schemes/ingest:
 *   post:
 *     summary: Upload and process a Scheme PDF
 *     tags:
 *       - Schemes
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - pdf
 *               - schemeName
 *               - benefitsValue
 *             properties:
 *               pdf:
 *                 type: string
 *                 format: binary
 *               schemeName:
 *                 type: string
 *                 example: PM Awas Yojana
 *               benefitsValue:
 *                 type: integer
 *                 example: 50000
 *     responses:
 *       201:
 *         description: Scheme processed successfully
 *       500:
 *         description: Server error
 */
router.post('/ingest', upload.single('pdf'), ingestScheme);

/**
 * @swagger
 * /schemes/search:
 *   post:
 *     summary: Search for schemes using AI Semantic Search
 *     description: Finds relevant schemes based on natural language queries (e.g., "help for farmers")
 *     tags:
 *       - Schemes
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: The natural language search query
 *         example: Financial help for building a house
 *     responses:
 *       200:
 *         description: List of matching schemes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 1
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       score:
 *                         type: number
 *                         description: Similarity score (0 to 1)
 *       400:
 *         description: Missing query parameter
 *       500:
 *         description: Server error
 */
router.post('/search', searchSchemes);

export default router;
