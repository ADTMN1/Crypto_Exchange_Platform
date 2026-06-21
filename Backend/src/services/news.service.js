import Parser from 'rss-parser';

const parser = new Parser();
const RSS_FEED_URL = 'https://cointelegraph.com/rss';

/**
 * Fetch crypto news from Cointelegraph RSS feed (free, no API key required)
 * @param {number} limit - Number of news articles to fetch
 * @returns {Promise<Array>} List of news articles
 */
export const fetchCryptoNews = async (limit = 20) => {
  try {
    const feed = await parser.parseURL(RSS_FEED_URL);
    
    if (feed && feed.items && Array.isArray(feed.items)) {
      return feed.items.slice(0, limit).map((article, index) => {
        // Extract image from content (Cointelegraph has images in content)
        let imageUrl = null;
        if (article.content) {
          const imgMatch = article.content.match(/<img[^>]+src="([^">]+)"/i);
          if (imgMatch && imgMatch[1]) {
            imageUrl = imgMatch[1];
          }
        }
        
        return {
          id: article.guid || article.link || `news-${index}`,
          title: article.title,
          excerpt: article.contentSnippet ? article.contentSnippet.substring(0, 200) + '...' : 'Click to read more',
          category: (article.categories && article.categories[0]) || 'Market',
          source: 'Cointelegraph',
          timeAgo: formatTimeAgo(article.pubDate),
          imageUrl: imageUrl,
          isTrending: index < 3,
          isBookmarked: false,
          relatedCrypto: article.categories || [],
          sentiment: 'neutral',
          url: article.link,
        };
      });
    }
    return [];
  } catch (error) {
    console.error('Error fetching crypto news:', error.message);
    // Return mock data as fallback
    return getMockNews();
  }
};

/**
 * Format timestamp to "time ago" string
 * @param {string} dateString - Date string from RSS feed
 * @returns {string} Formatted time string
 */
const formatTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const ms = Date.now() - date.getTime();
  
  const intervals = {
    year: 31536000000,
    month: 2592000000,
    week: 604800000,
    day: 86400000,
    hour: 3600000,
    minute: 60000
  };

  for (const [unit, msInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(ms / msInUnit);
    if (interval >= 1) {
      return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
    }
  }
  return 'just now';
};

/**
 * Mock news data as fallback
 * @returns {Array} Mock news articles
 */
const getMockNews = () => [
  {
    id: '1',
    title: 'Bitcoin Reaches New All-Time High as Institutional Adoption Soars',
    excerpt: 'Bitcoin has surged past $75,000 for the first time, driven by increased institutional investment and growing mainstream acceptance.',
    category: 'Breaking',
    source: 'Cointelegraph',
    timeAgo: '15 minutes ago',
    isTrending: true,
    isBookmarked: false,
    relatedCrypto: ['BTC'],
    sentiment: 'bullish',
    url: 'https://cointelegraph.com',
  },
  {
    id: '2',
    title: 'Ethereum 2.0 Upgrade Reduces Transaction Fees by 90%',
    excerpt: 'The latest Ethereum network upgrade has dramatically reduced gas fees, making DeFi applications more accessible to retail users.',
    category: 'Technology',
    source: 'Cointelegraph',
    timeAgo: '1 hour ago',
    isTrending: true,
    isBookmarked: false,
    relatedCrypto: ['ETH'],
    sentiment: 'bullish',
    url: 'https://cointelegraph.com',
  },
];
