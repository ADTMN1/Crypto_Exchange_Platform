import { useParams } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import { FaArrowUp, FaArrowDown, FaChartLine, FaWallet } from 'react-icons/fa';
import marketApi, { HistoryPoint } from '../../services/market.api';
import marketSocket from '../../socket/market.socket';
import TradeCandleChart from '../../components/trade/TradingChart';

const SUPPORTED = ['BTCUSDT','ETHUSDT','BNBUSDT','SOLUSDT','XRPUSDT',
  'ADAUSDT','DOGEUSDT','AVAXUSDT','DOTUSDT','MATICUSDT',
  'LTCUSDT','LINKUSDT','UNIUSDT','ATOMUSDT','TRXUSDT'];

const TIMEFRAMES = ['1m','5m','15m','30m','1h','4h','1d','1w'];

// Map display timeframe → Binance interval
const TF_MAP: Record<string, string> = {
  '1m':'1m','5m':'5m','15m':'15m','30m':'30m',
  '1h':'1h','4h':'4h','1d':'1d','1w':'1w',
};

// Interval duration in seconds (to bucket live trades into candles)
const TF_SECONDS: Record<string, number> = {
  '1m':60,'5m':300,'15m':900,'30m':1800,
  '1h':3600,'4h':14400,'1d':86400,'1w':604800,
};

interface PricePayload {
  symbol: string;
  price: number;
  tradeTime?: number;
  timestamp?: number;
}

export default function TradePage() {
  const { pair } = useParams<{ pair: string }>();
  const symbol = SUPPORTED.includes(pair?.toUpperCase() ?? '')
    ? pair!.toUpperCase()
    : 'BTCUSDT';
  const ticker = symbol.replace('USDT', '');

  const [activeTab, setActiveTab]   = useState<'charts' | 'trade' | 'positions'>('charts');
  const [timeframe, setTimeframe]   = useState('1h');
  const [candles, setCandles]       = useState<HistoryPoint[]>([]);
  const [liveCandle, setLiveCandle] = useState<HistoryPoint | null>(null);
  const [price, setPrice]           = useState<number | null>(null);
  const [prevPrice, setPrevPrice]   = useState<number | null>(null);
  const [change24h, setChange24h]   = useState<number>(0);
  const [high24h, setHigh24h]       = useState<number>(0);
  const [low24h, setLow24h]         = useState<number>(0);
  const [volume24h, setVolume24h]   = useState<number>(0);
  const [isLoading, setIsLoading]   = useState(true);

  // ── Load klines + 24h overview ───────────────────────────────────────────
  useEffect(() => {
    setIsLoading(true);
    setCandles([]);
    setLiveCandle(null);

    const load = async () => {
      try {
        const [klines, overview] = await Promise.allSettled([
          marketApi.getMarketHistory(symbol, TF_MAP[timeframe], 200),
          marketApi.getMarketOverview(),
        ]);

        if (klines.status === 'fulfilled') {
          setCandles(klines.value);
        }

        if (overview.status === 'fulfilled') {
          const row = overview.value.find(o => o.symbol === symbol);
          if (row) {
            setPrice(row.price);
            setChange24h(row.change24h ?? 0);
            setHigh24h((row as any).high24h ?? 0);
            setLow24h((row as any).low24h ?? 0);
            setVolume24h(row.volume24h ?? 0);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [symbol, timeframe]);

  // ── Live price + candle update via socket ────────────────────────────────
  const liveCandleRef = useRef<HistoryPoint | null>(null);
  const candlesRef    = useRef<HistoryPoint[]>([]);
  candlesRef.current  = candles;

  const priceHandlerRef = useRef<((p: PricePayload) => void) | undefined>(undefined);

  priceHandlerRef.current = useCallback((payload: PricePayload) => {
    if (payload.symbol !== symbol) return;

    const ts    = payload.tradeTime ?? payload.timestamp ?? Date.now();
    const tsSec = Math.floor(ts / 1000);
    const tf    = TF_SECONDS[timeframe] ?? 60;
    const bucketTime = Math.floor(tsSec / tf) * tf;
    const p = payload.price;

    setPrevPrice(prev => prev ?? p);
    setPrice(prev => { setPrevPrice(prev); return p; });

    // Update live (current) candle
    setLiveCandle(prev => {
      if (!prev || prev.time !== bucketTime) {
        // New candle
        const last = candlesRef.current[candlesRef.current.length - 1];
        const open = last?.close ?? p;
        const next: HistoryPoint = { time: bucketTime, open, high: p, low: p, close: p, volume: 0 };
        liveCandleRef.current = next;
        return next;
      }
      const updated: HistoryPoint = {
        ...prev,
        high:  Math.max(prev.high, p),
        low:   Math.min(prev.low, p),
        close: p,
      };
      liveCandleRef.current = updated;
      return updated;
    });
  }, [symbol, timeframe]);

  useEffect(() => {
    const handler = (p: PricePayload) => priceHandlerRef.current?.(p);
    const onConnect = () => marketSocket.emit('subscribe', symbol);

    marketSocket.on('connect', onConnect);
    marketSocket.on('price', handler);

    if (!marketSocket.connected) {
      marketSocket.connect();
    } else {
      onConnect();
    }

    return () => {
      marketSocket.emit('unsubscribe', symbol);
      marketSocket.off('connect', onConnect);
      marketSocket.off('price', handler);
    };
  }, [symbol]);

  const isUp = change24h >= 0;

  const fmt = (n: number, decimals = 2) =>
    n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

  const fmtVol = (v: number) => {
    if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
    if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
    return `$${(v / 1e3).toFixed(2)}K`;
  };

  const priceWentUp = price !== null && prevPrice !== null && price >= prevPrice;

  return (
    <main className="trade-page">

      {/* ── Header ── */}
      <div className="trade-header">
        <div className="price-section">
          <div className="pair-info">
            <h1 className="pair-name">{ticker}/USDT</h1>
            <span className={`price-badge ${isUp ? 'positive' : 'negative'}`}>
              {isUp ? <FaArrowUp /> : <FaArrowDown />} {Math.abs(change24h).toFixed(2)}%
            </span>
          </div>
          <div className="current-price" style={{ color: priceWentUp ? '#00C076' : '#FF4D4F', transition: 'color 0.3s' }}>
            {price ? `$${fmt(price)}` : '—'}
          </div>
          <div style={{ display: 'flex', gap: 24, marginTop: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, color: '#6B7280' }}>
              24h High: <span style={{ color: '#00C076' }}>{high24h ? `$${fmt(high24h)}` : '—'}</span>
            </span>
            <span style={{ fontSize: 13, color: '#6B7280' }}>
              24h Low: <span style={{ color: '#FF4D4F' }}>{low24h ? `$${fmt(low24h)}` : '—'}</span>
            </span>
            <span style={{ fontSize: 13, color: '#6B7280' }}>
              Volume: <span style={{ color: '#E5E7EB' }}>{volume24h ? fmtVol(volume24h) : '—'}</span>
            </span>
          </div>
        </div>

        <div className="portfolio-section">
          <div className="portfolio-card">
            <div className="portfolio-label">Live Stream</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#00C076', boxShadow: '0 0 8px #00C076', display: 'inline-block' }} />
              <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>ACTIVE</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="trade-tabs">
        <button className={`tab ${activeTab === 'charts' ? 'active' : ''}`} onClick={() => setActiveTab('charts')}>
          <FaChartLine /> Charts
        </button>
        <button className={`tab ${activeTab === 'trade' ? 'active' : ''}`} onClick={() => setActiveTab('trade')}>
          Trade
        </button>
        <button className={`tab ${activeTab === 'positions' ? 'active' : ''}`} onClick={() => setActiveTab('positions')}>
          Positions
        </button>
      </div>

      {/* ── Main Content ── */}
      <div className="trade-content">
        {activeTab === 'charts' && (
          <div className="charts-section">

            {/* Timeframe selector */}
            <div className="timeframe-selector" style={{ marginBottom: 16 }}>
              {TIMEFRAMES.map(tf => (
                <button
                  key={tf}
                  className={`timeframe-btn ${timeframe === tf ? 'active' : ''}`}
                  onClick={() => setTimeframe(tf)}
                >
                  {tf}
                </button>
              ))}
            </div>

            {/* Chart header */}
            <div className="chart-container">
              <div className="chart-header">
                <div className="chart-info">
                  <span className="chart-pair">{ticker}/USDT</span>
                  <span className="chart-price" style={{ color: priceWentUp ? '#00C076' : '#FF4D4F' }}>
                    {price ? `$${fmt(price)}` : '—'}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#6B7280' }}>
                  {timeframe} · Candlestick · Binance Live
                </div>
              </div>

              {/* REAL CANDLESTICK CHART */}
              <TradeCandleChart
                data={candles}
                symbol={symbol}
                liveCandle={liveCandle}
              />
            </div>

            {/* Quick Trade */}
            <div className="quick-trade-section">
              <h3 className="quick-trade-title">Quick Trade</h3>
              <div className="quick-trade-buttons">
                <button className="quick-trade-btn buy">
                  <span className="btn-label">BUY</span>
                  <span className="btn-subtitle">Long / Higher</span>
                </button>
                <button className="quick-trade-btn sell">
                  <span className="btn-label">SELL</span>
                  <span className="btn-subtitle">Short / Lower</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'trade' && (
          <div className="tab-placeholder">Advanced trading interface coming soon</div>
        )}

        {activeTab === 'positions' && (
          <div className="tab-placeholder">Your open positions will appear here</div>
        )}
      </div>
    </main>
  );
}
