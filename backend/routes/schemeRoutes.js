import express from 'express';
import multer from 'multer';
import { 
  ingestScheme, 
  searchSchemes, 
  getAllSchemes, 
  chatWithScheme,
  checkSchemeEligibility,  
  getRecommendedSchemes,     
  getDashboardMetrics
} from '../controllers/schemeController.js';
import { protect , authorize } from '../middleware/auth.js';
import { parseVoiceProfile } from '../controllers/schemeController.js';

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
router.post('/ingest', protect, authorize('admin'), upload.single('pdf'), ingestScheme);

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

/**
 * @swagger
 * /schemes/chat:
 *   post:
 *     summary: Chat with the AI about schemes (RAG)
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
 *                 example: How much money can I get for building a house?
 *               userProfile:
 *                 type: object
 *                 properties:
 *                   state:
 *                     type: string
 *                     example: Maharashtra
 *                   gender:
 *                     type: string
 *                     example: Female
 *     responses:
 *       200:
 *         description: AI generated answer
 */
router.post('/chat', protect, chatWithScheme);


/**
 * @swagger
 * /schemes/recommend:
 *   post:
 *     summary: Get smart recommendations based on profile
 *     tags: [Schemes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userProfile]
 *             properties:
 *               userProfile:
 *                 type: object
 *                 example:
 *                   state: Maharashtra
 *                   gender: Female
 *                   occupation: Farmer
 *     responses:
 *       200:
 *         description: List of top 5 recommended schemes
 */
router.post('/recommend', getRecommendedSchemes); 

/**
 * @swagger
 * /schemes/eligibility:
 *   post:
 *     summary: Check strict eligibility for a specific scheme
 *     tags: [Schemes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [schemeId, userProfile]
 *             properties:
 *               schemeId:
 *                 type: string
 *                 example: "65d4..."
 *               userProfile:
 *                 type: object
 *                 example:
 *                   age: 25
 *                   land_area: 5
 *     responses:
 *       200:
 *         description: Yes/No decision with proof
 */
router.post('/eligibility', checkSchemeEligibility);

/**
 * @swagger
 * /schemes/extract-profile:
 *   post:
 *     summary: Convert transcribed voice text (Hindi/English) into a structured JSON profile
 *     tags: [Schemes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [spokenText]
 *             properties:
 *               spokenText:
 *                 type: string
 *                 example: "मैं महाराष्ट्र के पुणे से हूँ। मेरे पास 2 एकड़ जमीन है और मैं कपास उगाता हूँ। मेरी जाति ओबीसी है।"
 *     responses:
 *       200:
 *         description: Structured profile extracted successfully
 */
router.post('/extract-profile', parseVoiceProfile);


/**
 * @swagger
 * /schemes/metrics:
 *   get:
 *     summary: Get impact metrics for the User Dashboard
 *     tags: [Schemes]
 *     responses:
 *       200:
 *         description: Metrics retrieved successfully
 */
router.get('/metrics', getDashboardMetrics);


export default router;
