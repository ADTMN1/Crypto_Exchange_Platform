import { useState, useEffect } from 'react';
import { FaNewspaper, FaFire, FaClock, FaArrowUp, FaArrowDown, FaBookmark, FaRegBookmark, FaSpinner } from 'react-icons/fa';
import newsService, { NewsArticle } from '../../services/news.service';

export default function NewsPage() {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [bookmarkedArticles, setBookmarkedArticles] = useState<Set<string>>(new Set());
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const categories = ['all', 'Breaking', 'Analysis', 'Market', 'Technology', 'DeFi', 'Regulation'];

  const fetchNews = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await newsService.getNews();
      if (response.data?.success && response.data?.data?.articles) {
        setNewsArticles(response.data.data.articles);
      }
    } catch (err) {
      console.error('Error fetching news:', err);
      setError('Failed to load news');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

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

      {loading ? (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          padding: '60px 20px',
          color: '#F7931A'
        }}>
          <FaSpinner style={{ fontSize: '48px', animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: '20px', fontSize: '18px' }}>Loading news...</p>
        </div>
      ) : error ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px 20px',
          color: '#ef4444'
        }}>
          <p style={{ fontSize: '18px' }}>{error}</p>
          <button
            onClick={fetchNews}
            style={{
              marginTop: '20px',
              padding: '12px 24px',
              backgroundColor: '#F7931A',
              color: '#0a0a0a',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Try Again
          </button>
        </div>
      ) : (
        <>
          {/* Trending Section */}
          {activeCategory === 'all' && (
            <div className="trending-section">
              <h2 className="section-heading">
                <FaFire style={{ color: '#F7931A' }} /> Trending Now
              </h2>
              <div className="trending-grid">
                {newsArticles.slice(0, 3).map((article) => (
                  <div
                    key={article.id}
                    className="trending-card"
                    onClick={() => article.url && window.open(article.url, '_blank')}
                    style={{ cursor: 'pointer' }}
                  >
                    {article.imageUrl && (
                      <div className="trending-card-image">
                        <img src={article.imageUrl} alt={article.title} style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px 8px 0 0' }} />
                      </div>
                    )}
                    <div className="trending-card-header">
                      <span 
                        className="category-badge" 
                        style={{ backgroundColor: getCategoryColor(article.category) }}
                      >
                        {article.category}
                      </span>
                      <button
                        className="bookmark-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleBookmark(article.id);
                        }}
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
                <article
                  key={article.id}
                  className="news-article"
                  onClick={() => article.url && window.open(article.url, '_blank')}
                  style={{ cursor: 'pointer' }}
                >
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
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleBookmark(article.id);
                      }}
                    >
                      {bookmarkedArticles.has(article.id) ? (
                        <FaBookmark style={{ color: '#F7931A' }} />
                      ) : (
                        <FaRegBookmark />
                      )}
                    </button>
                  </div>
                  {article.imageUrl && (
                    <div className="article-image">
                      <img src={article.imageUrl} alt={article.title} style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '8px', marginBottom: '16px' }} />
                    </div>
                  )}
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
        </>
      )}
    </main>
  );
}
