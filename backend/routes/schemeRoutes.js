import express from 'express';
import multer from ("multer");
import { ingestScheme } from '../controllers/schemeController.js';

const router = express.Router();

const upload = multer({ dest: 'uploads/' });


router.post('/ingest', upload.single('pdf'), ingestScheme);

export default router;