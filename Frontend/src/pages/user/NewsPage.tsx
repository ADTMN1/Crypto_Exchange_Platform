import { useState } from 'react';
import { FaNewspaper, FaFire, FaClock, FaArrowUp, FaArrowDown, FaBookmark, FaRegBookmark } from 'react-icons/fa';

interface NewsArticle {
  id: string;
  title: string;
  excerpt: string;
  category: 'Breaking' | 'Analysis' | 'Technology' | 'Regulation' | 'Market' | 'DeFi';
  source: string;
  timeAgo: string;
  imageUrl?: string;
  isTrending: boolean;
  isBookmarked: boolean;
  relatedCrypto?: string[];
  sentiment?: 'bullish' | 'bearish' | 'neutral';
}

export default function NewsPage() {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [bookmarkedArticles, setBookmarkedArticles] = useState<Set<string>>(new Set());

  const categories = ['all', 'Breaking', 'Analysis', 'Market', 'Technology', 'DeFi', 'Regulation'];

  const newsArticles: NewsArticle[] = [
    {
      id: '1',
      title: 'Bitcoin Reaches New All-Time High as Institutional Adoption Soars',
      excerpt: 'Bitcoin has surged past $75,000 for the first time, driven by increased institutional investment and growing mainstream acceptance.',
      category: 'Breaking',
      source: 'CryptoNews',
      timeAgo: '15 minutes ago',
      isTrending: true,
      isBookmarked: false,
      relatedCrypto: ['BTC'],
      sentiment: 'bullish',
    },
    {
      id: '2',
      title: 'Ethereum 2.0 Upgrade Reduces Transaction Fees by 90%',
      excerpt: 'The latest Ethereum network upgrade has dramatically reduced gas fees, making DeFi applications more accessible to retail users.',
      category: 'Technology',
      source: 'Blockchain Today',
      timeAgo: '1 hour ago',
      isTrending: true,
      isBookmarked: false,
      relatedCrypto: ['ETH'],
      sentiment: 'bullish',
    },
    {
      id: '3',
      title: 'SEC Announces New Guidelines for Cryptocurrency Exchanges',
      excerpt: 'The Securities and Exchange Commission has released comprehensive guidelines that could reshape how crypto exchanges operate in the US.',
      category: 'Regulation',
      source: 'Financial Times',
      timeAgo: '2 hours ago',
      isTrending: false,
      isBookmarked: false,
      relatedCrypto: ['BTC', 'ETH'],
      sentiment: 'neutral',
    },
    {
      id: '4',
      title: 'Solana Network Experiences Brief Outage, Recovery Underway',
      excerpt: 'The Solana blockchain experienced a temporary network disruption lasting approximately 4 hours before validators restored normal operations.',
      category: 'Technology',
      source: 'CoinDesk',
      timeAgo: '3 hours ago',
      isTrending: false,
      isBookmarked: false,
      relatedCrypto: ['SOL'],
      sentiment: 'bearish',
    },
    {
      id: '5',
      title: 'DeFi Total Value Locked Surpasses $200 Billion Milestone',
      excerpt: 'Decentralized finance protocols have collectively reached a new record with over $200 billion in total value locked across all platforms.',
      category: 'DeFi',
      source: 'DeFi Pulse',
      timeAgo: '5 hours ago',
      isTrending: true,
      isBookmarked: false,
      sentiment: 'bullish',
    },
    {
      id: '6',
      title: 'Major Banks Partner to Launch Blockchain Payment Network',
      excerpt: 'Five major international banks have announced a collaborative effort to create a cross-border payment system using blockchain technology.',
      category: 'Analysis',
      source: 'Bloomberg Crypto',
      timeAgo: '6 hours ago',
      isTrending: false,
      isBookmarked: false,
      sentiment: 'bullish',
    },
    {
      id: '7',
      title: 'Crypto Market Analysis: Technical Indicators Point to Continued Bull Run',
      excerpt: 'Leading technical analysts suggest multiple indicators are aligning for a sustained upward trend in major cryptocurrencies.',
      category: 'Market',
      source: 'Trading View',
      timeAgo: '8 hours ago',
      isTrending: false,
      isBookmarked: false,
      relatedCrypto: ['BTC', 'ETH'],
      sentiment: 'bullish',
    },
    {
      id: '8',
      title: 'NFT Marketplace Volume Drops 60% Amid Market Correction',
      excerpt: 'Trading volumes on major NFT marketplaces have declined significantly as the broader crypto market experiences a correction period.',
      category: 'Market',
      source: 'NFT Stats',
      timeAgo: '10 hours ago',
      isTrending: false,
      isBookmarked: false,
      sentiment: 'bearish',
    },
  ];

  const toggleBookmark = (articleId: string) => {
    setBookmarkedArticles((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(articleId)) {
        newSet.delete(articleId);
      } else {
        newSet.add(articleId);
      }
      return newSet;
    });
  };

  const filteredNews = activeCategory === 'all' 
    ? newsArticles 
    : newsArticles.filter((article) => article.category === activeCategory);

  const getSentimentIcon = (sentiment?: string) => {
    if (sentiment === 'bullish') return <FaArrowUp style={{ color: '#24C576' }} />;
    if (sentiment === 'bearish') return <FaArrowDown style={{ color: '#E53935' }} />;
    return null;
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Breaking': '#ef4444',
      'Analysis': '#3b82f6',
      'Technology': '#8b5cf6',
      'Regulation': '#f59e0b',
      'Market': '#10b981',
      'DeFi': '#ec4899',
    };
    return colors[category] || '#F7931A';
  };

  return (
    <main className="news-page">
      {/* Header */}
      <div className="news-header">
        <div className="news-header-content">
          <h1 className="page-title">
            <FaNewspaper className="title-icon" />
            Crypto News & Updates
          </h1>
          <p className="page-subtitle">
            Stay informed with the latest cryptocurrency news, market analysis, and industry updates
          </p>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="news-categories">
        {categories.map((category) => (
          <button
            key={category}
            className={`category-tab ${activeCategory === category ? 'active' : ''}`}
            onClick={() => setActiveCategory(category)}
          >
            {category === 'all' ? 'All News' : category}
          </button>
        ))}
      </div>

      {/* Trending Section */}
      {activeCategory === 'all' && (
        <div className="trending-section">
          <h2 className="section-heading">
            <FaFire style={{ color: '#F7931A' }} /> Trending Now
          </h2>
          <div className="trending-grid">
            {newsArticles.filter((article) => article.isTrending).slice(0, 3).map((article) => (
              <div key={article.id} className="trending-card">
                <div className="trending-card-header">
                  <span 
                    className="category-badge" 
                    style={{ backgroundColor: getCategoryColor(article.category) }}
                  >
                    {article.category}
                  </span>
                  <button
                    className="bookmark-btn"
                    onClick={() => toggleBookmark(article.id)}
                  >
                    {bookmarkedArticles.has(article.id) ? (
                      <FaBookmark style={{ color: '#F7931A' }} />
                    ) : (
                      <FaRegBookmark />
                    )}
                  </button>
                </div>
                <h3 className="trending-card-title">{article.title}</h3>
                <p className="trending-card-excerpt">{article.excerpt}</p>
                <div className="trending-card-footer">
                  <span className="news-source">{article.source}</span>
                  <span className="news-time">
                    <FaClock /> {article.timeAgo}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* News List */}
      <div className="news-list-section">
        <h2 className="section-heading">Latest Articles</h2>
        <div className="news-list">
          {filteredNews.map((article) => (
            <article key={article.id} className="news-article">
              <div className="article-header">
                <span 
                  className="category-badge" 
                  style={{ backgroundColor: getCategoryColor(article.category) }}
                >
                  {article.category}
                </span>
                {article.sentiment && (
                  <span className="sentiment-indicator">
                    {getSentimentIcon(article.sentiment)}
                  </span>
                )}
                <button
                  className="bookmark-btn"
                  onClick={() => toggleBookmark(article.id)}
                >
                  {bookmarkedArticles.has(article.id) ? (
                    <FaBookmark style={{ color: '#F7931A' }} />
                  ) : (
                    <FaRegBookmark />
                  )}
                </button>
              </div>
              <h3 className="article-title">{article.title}</h3>
              <p className="article-excerpt">{article.excerpt}</p>
              <div className="article-footer">
                <div className="article-meta">
                  <span className="news-source">{article.source}</span>
                  <span className="news-time">
                    <FaClock /> {article.timeAgo}
                  </span>
                </div>
                {article.relatedCrypto && article.relatedCrypto.length > 0 && (
                  <div className="related-crypto">
                    {article.relatedCrypto.map((crypto) => (
                      <span key={crypto} className="crypto-tag">
                        {crypto}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
