import express from 'express';
import multer from 'multer';
import { ingestScheme, searchSchemes, getAllSchemes } from '../controllers/schemeController.js';

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
 *         description:
 *           type: string
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
 *     summary: Search for schemes using AI Semantic Search with Filters
 *     description: Finds relevant schemes based on natural language queries and user profile filters.
 *     tags:
 *       - Schemes
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *             properties:
 *               query:
 *                 type: string
 *                 description: The natural language search query
 *                 example: Financial help for building a house
 *               userProfile:
 *                 type: object
 *                 description: Optional user details for filtering
 *                 properties:
 *                   state:
 *                     type: string
 *                     example: Maharashtra
 *                   gender:
 *                     type: string
 *                     enum:
 *                       - Male
 *                       - Female
 *                       - Other
 *                     example: Female
 *                   caste:
 *                     type: string
 *                     enum:
 *                       - General
 *                       - OBC
 *                       - SC
 *                       - ST
 *                     example: OBC
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
 *                       snippet:
 *                         type: string
 *                         description: Relevant text chunk from the scheme
 *       400:
 *         description: Missing query parameter
 *       500:
 *         description: Server error
 */
router.post('/search', searchSchemes);

/**
 * @swagger
 * /schemes/debug:
 *   get:
 *     summary: Retrieve all schemes for debugging (Name & Filters only)
 *     description: Returns a list of all ingested schemes with their names and extracted filters to verify data integrity.
 *     tags:
 *       - Schemes
 *     responses:
 *       200:
 *         description: List of schemes with filters
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     example: "65d4f8a1e9b2a..."
 *                   name:
 *                     type: string
 *                     example: "PM Awas Yojana"
 *                   filters:
 *                     type: object
 *                     properties:
 *                       state:
 *                         type: array
 *                         items:
 *                           type: string
 *                         example:
 *                           - Pan-India
 *                       gender:
 *                         type: array
 *                         items:
 *                           type: string
 *                         example:
 *                           - All
 *                       caste:
 *                         type: array
 *                         items:
 *                           type: string
 *                         example:
 *                           - General
 *                           - OBC
 *       500:
 *         description: Server error
 */
router.get('/debug', getAllSchemes);

export default router;
