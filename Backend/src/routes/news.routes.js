import express from 'express';
const router = express.Router();
import { getNews } from '../controllers/news.controller.js';

/**
 * @route GET /api/news
 * @description Fetch crypto news
 */
router.get('/', getNews);

export default router;
