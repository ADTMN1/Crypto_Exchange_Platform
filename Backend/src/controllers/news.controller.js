import { fetchCryptoNews } from '../services/news.service.js';

/**
 * Get crypto news
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const getNews = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const news = await fetchCryptoNews(limit);
    res.status(200).json({
      success: true,
      message: 'News fetched successfully',
      data: {
        articles: news,
      },
    });
  } catch (error) {
    console.error('Error getting news:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch news',
      error: error.message,
    });
  }
};
