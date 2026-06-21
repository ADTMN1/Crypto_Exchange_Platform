import { FaArrowUp, FaExchangeAlt, FaHeadset, FaChartLine, FaComments, FaEye, FaEyeSlash, FaSpinner } from 'react-icons/fa';
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DepositModal from '../../components/common/DepositModal';
import LoadingOverlay from '../../components/common/LoadingOverlay';
import walletService from '../../services/wallet.service';
import newsService from '../../services/news.service';
import { useWalletStore } from '../../store/useWalletStore';

export default function WalletPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showBalance, setShowBalance] = useState(true);
  const [open, setOpen] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [newsItems, setNewsItems] = useState<any[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { wallets, totalUSD, isLoading, fetchWallet } = useWalletStore();
  const loading = isLoading && transactions.length === 0;

  const formatAmount = (amount: number, currency: string) => {
    if (currency === 'USDT') {
      return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `${amount.toLocaleString('en-US', { minimumFractionDigits: 8, maximumFractionDigits: 8 })}`;
  };

  const fetchTransactions = async () => {
    try {
      const transactionsData = await walletService.getTransactions();
      const transactionsPayload = transactionsData?.data?.data || {};
      setTransactions(transactionsPayload.transactions || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load transactions');
    }
  };

  const fetchNews = async () => {
    try {
      setNewsLoading(true);
      const response = await newsService.getNews(5);
      if (response.data?.success && response.data?.data?.articles) {
        setNewsItems(
          response.data.data.articles.map((article: any) => ({
            tag: article.category?.toUpperCase() || 'NEWS',
            title: article.title,
            source: article.source,
            time: article.timeAgo,
            tagColor: '#F7931A',
          }))
        );
      }
    } catch (err) {
      console.error('Failed to fetch news for wallet page:', err);
    } finally {
      setNewsLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
    fetchTransactions();
    fetchNews();
    // Check if we're on /wallet/deposit and open the modal
    if (location.pathname === '/wallet/deposit') {
      setOpen(true);
    }
  }, [fetchWallet, location.pathname]);

  const cryptoData = [
    { symbol: 'BTCUSDT', volume: '1813011074362.9M', price: '$73405.92', change: '+4.34%', positive: true },
    { symbol: 'XRPUSDT', volume: '132132186768.1M', price: '$1.39', change: '+335.53%', positive: true },
    { symbol: 'TRXUSDT', volume: '28123253132.9M', price: '$0.30', change: '+196.97%', positive: true },
    { symbol: 'PAXGUSDT', volume: '1685331061.4M', price: '$4952.70', change: '+3.67%', positive: true },
    { symbol: 'SOL_USDT', volume: '47653566961.9M', price: '$82.40', change: '+1.60%', positive: true },
    { symbol: 'XAUt_USD', volume: '1500000000000.0M', price: '$4914.50', change: '+0.75%', positive: true },
    { symbol: 'XAG_USD', volume: '180000000000.0M', price: '$23.15', change: '-0.32%', positive: false },
  ];

  return (
    <main className="wallet-page" style={{ position: 'relative', minHeight: '80vh' }}>
      {loading && (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          padding: '60px 20px',
          color: '#F7931A'
        }}>
          <FaSpinner style={{ fontSize: '48px', animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: '20px', fontSize: '18px' }}>Loading wallet data...</p>
        </div>
      )}
      {error && <div style={{ padding: '20px', color: 'red' }}>Error: {error}</div>}
      
      {!loading && (
        <>
          {/* Total Assets Card */}
          <div className="assets-card">
        <div className="assets-header">
          <div>
            <h3 className="assets-label">Total Assets</h3>
            <div className="assets-amount-container">
              <h1 className="assets-amount">
                {showBalance ? formatAmount(totalUSD, 'USDT') : '***********'}
              </h1>
              <button 
                className="toggle-balance-btn" 
                onClick={() => setShowBalance(!showBalance)}
                title={showBalance ? 'Hide balance' : 'Show balance'}
              >
                {showBalance ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            <p className="assets-change positive">
              <FaArrowUp /> {wallets.length} currencies
            </p>
          </div>
          <div className="action-buttons-container">
            <button className="btn-deposit" onClick={() => {
              navigate('/wallet/deposit');
              setOpen(true);
            }}>Deposit</button>
            <button className="btn-deposit" onClick={() => navigate('/wallet/withdraw')} style={{ background: 'var(--surface-hover)', color: 'var(--primary)', border: '1px solid var(--primary)' }}>Withdraw</button>
          </div>
          <DepositModal open={open} onClose={() => {
            setOpen(false);
            if (location.pathname === '/wallet/deposit') {
              navigate('/wallet');
            }
          }} />
        </div>
      </div>

      {/* Wallet Balances */}
      {!loading && wallets.length > 0 && (
        <div className="top-cryptos-section">
          <div className="section-header">
            <h2 className="section-title">Your Wallets</h2>
          </div>
          <div className="crypto-table">
            {wallets.map((wallet, index) => (
              <div key={index} className="crypto-row">
                <div className="crypto-info">
                  <span className="crypto-symbol">{wallet.currency}</span>
                  <span className="crypto-volume">
                    Locked: {parseFloat(wallet.locked_balance).toFixed(8)}
                  </span>
                </div>
                <div className="crypto-stats">
                  <span className="crypto-price">
                    {parseFloat(wallet.balance).toFixed(8)}
                  </span>
                  <span className="crypto-change positive">
                    Available
                  </span>
                  <span style={{ color: '#10b981', fontSize: '0.875rem' }}>
                    {formatAmount(wallet.usdValue, 'USDT')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      {!loading && transactions.length > 0 && (
        <div className="market-insights-section">
          <div className="section-header">
            <h2 className="section-title">Recent Transactions</h2>
          </div>
          <div className="news-list">
            {transactions.slice(0, 5).map((tx, index) => (
              <div key={index} className="news-item">
                <span 
                  className="news-tag" 
                  style={{ 
                    backgroundColor: tx.type === 'deposit' ? '#28a745' : '#dc3545' 
                  }}
                >
                  {tx.type.toUpperCase()}
                </span>
                <div className="news-content">
                  <h4 className="news-title">
                    {tx.amount} {tx.currency} - {tx.status}
                  </h4>
                  <p className="news-meta">
                    {new Date(tx.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="quick-actions-section">
        <h2 className="section-title">Quick Actions</h2>
        <div className="quick-actions-grid">
          <button className="action-card" onClick={() => navigate('/history')}>
            <FaExchangeAlt className="action-icon" />
            <span>Transactions</span>
          </button>
          <button className="action-card" onClick={() => navigate('/trade')}>
            <FaChartLine className="action-icon" />
            <span>Trades</span>
          </button>
          <button className="action-card" onClick={() => navigate('/support')}>
            <FaHeadset className="action-icon" />
            <span>Support</span>
          </button>
          <button className="action-card">
            <FaComments className="action-icon" />
            <span>Live Chat</span>
          </button>
        </div>
      </div>

      {/* Market Insights */}
      <div className="market-insights-section">
        <div className="section-header">
          <h2 className="section-title">Market Insights</h2>
          <a href="#" className="view-all-link">View All</a>
        </div>
        {newsLoading ? (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: '40px 20px',
            color: '#F7931A'
          }}>
            <FaSpinner style={{ fontSize: '36px', animation: 'spin 1s linear infinite' }} />
            <p style={{ marginTop: '16px', fontSize: '14px' }}>Loading news...</p>
          </div>
        ) : (
          <div className="news-list">
            {newsItems.map((news, index) => (
              <div key={index} className="news-item">
                <span className="news-tag" style={{ backgroundColor: news.tagColor }}>
                  {news.tag}
                </span>
                <div className="news-content">
                  <h4 className="news-title">{news.title}</h4>
                  <p className="news-meta">
                    {news.source} • {news.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top Cryptos */}
      <div className="top-cryptos-section">
        <div className="section-header">
          <h2 className="section-title">Top Cryptos</h2>
          <a href="#" className="view-all-link">View More</a>
        </div>
        <div className="crypto-table">
          {cryptoData.map((crypto, index) => (
            <div key={index} className="crypto-row">
              <div className="crypto-info">
                <span className="crypto-symbol">{crypto.symbol}</span>
                <span className="crypto-volume">Vol: {crypto.volume}</span>
              </div>
              <div className="crypto-stats">
                <span className="crypto-price">{crypto.price}</span>
                <span className={`crypto-change ${crypto.positive ? 'positive' : 'negative'}`}>
                  {crypto.change}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      </>
      )}
    </main>
  );
}
