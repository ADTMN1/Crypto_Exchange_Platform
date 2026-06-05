import { useState, useEffect, useRef, type ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { FaSearch, FaStar, FaArrowUp, FaArrowDown, FaChartLine, FaBitcoin, FaEthereum } from 'react-icons/fa';
import { SiBinance, SiSolana, SiRipple, SiCardano, SiDogecoin, SiPolygon } from 'react-icons/si';
import marketApi from '../../services/market.api';
import marketSocket from '../../socket/market.socket';

interface Market {
  id: string;
  symbol: string;
  baseCurrency: string;
  quoteCurrency: string;
  lastPrice: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  isFavorite: boolean;
}

export default function MarketsPage() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [filteredMarkets, setFilteredMarkets] = useState<Market[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'favorites' | 'gainers' | 'losers'>('all');
  const [activeTab, setActiveTab] = useState<'cryptos' | 'metals' | 'hot' | 'gainers' | 'droppers'>('cryptos');
  const [sortBy, setSortBy] = useState<'volume' | 'change' | 'price'>('volume');
  const [isLoading, setIsLoading] = useState(true);

  // ── Load real 24h data from Binance via backend ──────────────────────────
  useEffect(() => {
    marketApi.getMarketOverview().then((overview) => {
      const loaded: Market[] = overview.map((item, idx) => ({
        id:            String(idx + 1),
        symbol:        item.symbol,
        baseCurrency:  item.symbol.replace('USDT', ''),
        quoteCurrency: 'USDT',
        lastPrice:     item.price,
        change24h:     item.change24h  ?? 0,
        high24h:       (item as any).high24h   ?? 0,
        low24h:        (item as any).low24h    ?? 0,
        volume24h:     item.volume24h  ?? 0,
        isFavorite:    false,
      }));
      setMarkets(loaded);
      setFilteredMarkets(loaded);
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  }, []);

  // ── Live price updates from root namespace "market:price_update" ──────────
  const marketsRef = useRef<Market[]>([]);
  marketsRef.current = markets;

  useEffect(() => {
    if (markets.length === 0) return;

    const handler = (payload: { symbol: string; price: number }) => {
      setMarkets(prev =>
        prev.map(m => m.symbol === payload.symbol ? { ...m, lastPrice: payload.price } : m)
      );
    };

    marketSocket.on('market:price_update', handler);
    if (!marketSocket.connected) marketSocket.connect();

    return () => { marketSocket.off('market:price_update', handler); };
  }, [markets.length > 0]);

  // Filter and search
  useEffect(() => {
    let filtered = [...markets];

    // Apply tab filter
    switch (activeTab) {
      case 'cryptos':
        // Show all cryptos (default)
        break;
      case 'metals':
        // Filter for metals/commodities (PAXG, XAU, XAG)
        filtered = filtered.filter((market) => 
          market.baseCurrency.includes('PAXG') || 
          market.baseCurrency.includes('XAU') || 
          market.baseCurrency.includes('XAG')
        );
        break;
      case 'hot':
        // Show high volume markets
        filtered = filtered.filter((market) => market.volume24h > 5000000000);
        break;
      case 'gainers':
        // Show only gainers (positive change)
        filtered = filtered.filter((market) => market.change24h > 0);
        filtered.sort((a, b) => b.change24h - a.change24h);
        break;
      case 'droppers':
        // Show only losers (negative change)
        filtered = filtered.filter((market) => market.change24h < 0);
        filtered.sort((a, b) => a.change24h - b.change24h);
        break;
    }

    // Apply search
    if (searchQuery) {
      filtered = filtered.filter(
        (market) =>
          market.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
          market.baseCurrency.toLowerCase().includes(searchQuery.toLowerCase()) ||
          market.quoteCurrency.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply filter
    switch (activeFilter) {
      case 'favorites':
        filtered = filtered.filter((market) => market.isFavorite);
        break;
      case 'gainers':
        filtered = filtered.filter((market) => market.change24h > 0);
        break;
      case 'losers':
        filtered = filtered.filter((market) => market.change24h < 0);
        break;
    }

    // Apply sort (only if not already sorted by tab)
    if (activeTab !== 'gainers' && activeTab !== 'droppers') {
      filtered.sort((a, b) => {
        switch (sortBy) {
          case 'volume':
            return b.volume24h - a.volume24h;
          case 'change':
            return b.change24h - a.change24h;
          case 'price':
            return b.lastPrice - a.lastPrice;
          default:
            return 0;
        }
      });
    }

    setFilteredMarkets(filtered);
  }, [markets, searchQuery, activeFilter, activeTab, sortBy]);

  const toggleFavorite = (id: string) => {
    setMarkets((prev) =>
      prev.map((market) =>
        market.id === id ? { ...market, isFavorite: !market.isFavorite } : market
      )
    );
  };

  const formatNumber = (num: number, decimals: number = 2) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
  };

  const formatVolume = (num: number) => {
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  const getCryptoIcon = (symbol: string) => {
    const iconMap: { [key: string]: ReactElement } = {
      'BTC': <FaBitcoin style={{ color: '#F7931A' }} />,
      'ETH': <FaEthereum style={{ color: '#627EEA' }} />,
      'BNB': <SiBinance style={{ color: '#F3BA2F' }} />,
      'SOL': <SiSolana style={{ color: '#14F195' }} />,
      'XRP': <SiRipple style={{ color: '#23292F' }} />,
      'ADA': <SiCardano style={{ color: '#0033AD' }} />,
      'DOGE': <SiDogecoin style={{ color: '#C2A633' }} />,
      'MATIC': <SiPolygon style={{ color: '#8247E5' }} />,
    };
    return iconMap[symbol] || <FaChartLine style={{ color: '#F7931A' }} />;
  };

  const marketStats = {
    totalMarkets: markets.length,
    totalVolume24h: markets.reduce((sum, m) => sum + m.volume24h, 0),
    gainers: markets.filter((m) => m.change24h > 0).length,
    losers: markets.filter((m) => m.change24h < 0).length,
  };

  return (
    <main className="markets-page">
      {/* Header */}
      <div className="markets-header">
        <div className="header-content">
          <h1 className="page-title">
            <FaChartLine className="title-icon" />
            Cryptocurrency Markets
          </h1>
          <p className="page-subtitle">
            Browse and trade {marketStats.totalMarkets} active crypto markets with real-time pricing
          </p>
        </div>

        {/* Market Stats */}
        <div className="market-stats-grid">
          <div className="stat-card">
            <div className="stat-label">24h Volume</div>
            <div className="stat-value">{formatVolume(marketStats.totalVolume24h)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Active Markets</div>
            <div className="stat-value">{marketStats.totalMarkets}</div>
          </div>
          <div className="stat-card green">
            <div className="stat-label">Gainers</div>
            <div className="stat-value">
              <FaArrowUp /> {marketStats.gainers}
            </div>
          </div>
          <div className="stat-card red">
            <div className="stat-label">Losers</div>
            <div className="stat-value">
              <FaArrowDown /> {marketStats.losers}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="market-tabs">
        <button
          className={`market-tab ${activeTab === 'cryptos' ? 'active' : ''}`}
          onClick={() => setActiveTab('cryptos')}
        >
          Cryptos
        </button>
        <button
          className={`market-tab ${activeTab === 'metals' ? 'active' : ''}`}
          onClick={() => setActiveTab('metals')}
        >
          Metals
        </button>
        <button
          className={`market-tab ${activeTab === 'hot' ? 'active' : ''}`}
          onClick={() => setActiveTab('hot')}
        >
          🔥 Hot
        </button>
        <button
          className={`market-tab ${activeTab === 'gainers' ? 'active' : ''}`}
          onClick={() => setActiveTab('gainers')}
        >
          <FaArrowUp /> Gainers
        </button>
        <button
          className={`market-tab ${activeTab === 'droppers' ? 'active' : ''}`}
          onClick={() => setActiveTab('droppers')}
        >
          <FaArrowDown /> Droppers
        </button>
      </div>

      {/* Filters and Search */}
      <div className="markets-controls">
        <div className="search-box">
          <FaSearch className="search-icon" style={{ color: '#F7931A' }} />
          <input
            type="text"
            placeholder="Search markets (BTC, ETH, SOL...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-buttons">
          <button
            className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            All Markets
          </button>
          <button
            className={`filter-btn ${activeFilter === 'favorites' ? 'active' : ''}`}
            onClick={() => setActiveFilter('favorites')}
          >
            <FaStar /> Favorites
          </button>
          <button
            className={`filter-btn ${activeFilter === 'gainers' ? 'active' : ''}`}
            onClick={() => setActiveFilter('gainers')}
          >
            <FaArrowUp /> Gainers
          </button>
          <button
            className={`filter-btn ${activeFilter === 'losers' ? 'active' : ''}`}
            onClick={() => setActiveFilter('losers')}
          >
            <FaArrowDown /> Losers
          </button>
        </div>

        <div className="sort-dropdown">
          <label htmlFor="sort-select">Sort by:</label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="sort-select"
          >
            <option value="volume">Volume</option>
            <option value="change">24h Change</option>
            <option value="price">Price</option>
          </select>
        </div>
      </div>

      {/* Markets Table */}
      <div className="markets-table-container">
        {isLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading markets...</p>
          </div>
        ) : filteredMarkets.length === 0 ? (
          <div className="empty-state">
            <p>No markets found matching your criteria</p>
          </div>
        ) : (
          <table className="markets-table">
            <thead>
              <tr>
                <th></th>
                <th>Market</th>
                <th className="text-right">Last Price</th>
                <th className="text-right">24h Change</th>
                <th className="text-right">24h High</th>
                <th className="text-right">24h Low</th>
                <th className="text-right">24h Volume</th>
                <th className="text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredMarkets.map((market) => (
                <tr key={market.id} className="market-row">
                  <td className="favorite-cell">
                    <button
                      className={`favorite-btn ${market.isFavorite ? 'active' : ''}`}
                      onClick={() => toggleFavorite(market.id)}
                      aria-label="Toggle favorite"
                    >
                      <FaStar />
                    </button>
                  </td>
                  <td className="market-cell">
                    <div className="market-info">
                      <div className="market-icon-wrapper">
                        {getCryptoIcon(market.baseCurrency)}
                        <div>
                          <span className="market-symbol">{market.symbol}</span>
                          <span className="market-pair">
                            {market.baseCurrency}/{market.quoteCurrency}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="price-cell text-right">
                    ${formatNumber(market.lastPrice, market.lastPrice < 1 ? 4 : 2)}
                  </td>
                  <td className={`change-cell text-right ${market.change24h >= 0 ? 'positive' : 'negative'}`}>
                    <span className="change-badge">
                      {market.change24h >= 0 ? <FaArrowUp /> : <FaArrowDown />}
                      {Math.abs(market.change24h).toFixed(2)}%
                    </span>
                  </td>
                  <td className="text-right">
                    ${formatNumber(market.high24h, market.high24h < 1 ? 4 : 2)}
                  </td>
                  <td className="text-right">
                    ${formatNumber(market.low24h, market.low24h < 1 ? 4 : 2)}
                  </td>
                  <td className="volume-cell text-right">{formatVolume(market.volume24h)}</td>
                  <td className="action-cell text-center">
                    <Link to={`/trade/${market.symbol.toLowerCase()}`} className="trade-btn">
                      Trade
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
