import api from './api.service';

export interface NewsArticle {
  id: string;
  title: string;
  excerpt: string;
  category: 'Breaking' | 'Analysis' | 'Technology' | 'Regulation' | 'Market' | 'DeFi' | string;
  source: string;
  timeAgo: string;
  imageUrl?: string;
  isTrending: boolean;
  isBookmarked: boolean;
  relatedCrypto?: string[];
  sentiment?: 'bullish' | 'bearish' | 'neutral';
  url?: string;
}

export interface NewsResponse {
  success: boolean;
  message: string;
  data: {
    articles: NewsArticle[];
  };
}

const newsService = {
  getNews: async (limit = 20): Promise<NewsResponse> => {
    return api.get(`/news?limit=${limit}`);
  },
};

export default newsService;
