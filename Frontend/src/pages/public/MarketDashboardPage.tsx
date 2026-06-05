import { useState, useEffect, useCallback, useRef } from 'react';
import marketApi, { MarketOverview, MarketPrice } from '../../services/market.api';
import marketSocket from '../../socket/market.socket';
import PriceCard from '../../components/market/PriceCard';
import MarketTable, { MarketRow } from '../../components/market/MarketTable';
import TradingChart, { ChartPoint } from '../../components/market/TradingChart';

const TOP_CARDS    = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT'];
const TABLE_COINS  = ['BTCUSDT','ETHUSDT','BNBUSDT','SOLUSDT','XRPUSDT','ADAUSDT','DOGEUSDT','AVAXUSDT','DOTUSDT','MATICUSDT','LTCUSDT','LINKUSDT','UNIUSDT','ATOMUSDT','TRXUSDT'];
const CHART_SYMBOL = 'BTCUSDT';
const MAX_POINTS   = 100;

interface PricePayload {
  symbol: string;
  price: number;
  tradeTime?: number;
  timestamp?: number;
}

export default function MarketDashboardPage() {
  const [prices, setPrices]       = useState<Record<string, number>>({});
  const [changes, setChanges]     = useState<Record<string, number>>({});
  const [volumes, setVolumes]     = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);

  // ── 1. Load initial data from REST API ───────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        // Fetch prices + 24h overview in parallel
        const [priceList, overview] = await Promise.allSettled([
          marketApi.getAllPrices(),
          marketApi.getMarketOverview(),
        ]);

        const priceMap:  Record<string, number> = {};
        const changeMap: Record<string, number> = {};
        const volumeMap: Record<string, number> = {};

        if (priceList.status === 'fulfilled') {
          (priceList.value as MarketPrice[]).forEach(d => { priceMap[d.symbol] = d.price; });
        }

        if (overview.status === 'fulfilled') {
          (overview.value as MarketOverview[]).forEach(d => {
            changeMap[d.symbol] = d.change24h  ?? 0;
            volumeMap[d.symbol] = d.volume24h  ?? 0;
            if (!priceMap[d.symbol]) priceMap[d.symbol] = d.price;
          });
        }

        setPrices(priceMap);
        setChanges(changeMap);
        setVolumes(volumeMap);

        if (priceMap[CHART_SYMBOL]) {
          setChartData([{ time: Date.now(), price: priceMap[CHART_SYMBOL] }]);
        }
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to load market data.');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // ── 2. Stable price handler ──────────────────────────────────────────────
  const priceHandlerRef = useRef<((p: PricePayload) => void) | undefined>(undefined);

  priceHandlerRef.current = useCallback((payload: PricePayload) => {
    const { symbol, price } = payload;
    const ts = payload.tradeTime ?? payload.timestamp ?? Date.now();

    setPrices(prev => ({ ...prev, [symbol]: price }));

    if (symbol === CHART_SYMBOL) {
      setChartData(prev => {
        const next = [...prev, { time: ts, price }];
        return next.length > MAX_POINTS ? next.slice(-MAX_POINTS) : next;
      });
    }
  }, []);

  // ── 3. Connect to /market namespace + subscribe ──────────────────────────
  useEffect(() => {
    const stableHandler = (p: PricePayload) => priceHandlerRef.current!(p);

    const onConnect = () => {
      TABLE_COINS.forEach(sym => marketSocket.emit('subscribe', sym));
    };

    marketSocket.on('connect', onConnect);
    marketSocket.on('price', stableHandler);   // /market namespace emits 'price'

    if (!marketSocket.connected) {
      marketSocket.connect();
    } else {
      onConnect();
    }

    return () => {
      TABLE_COINS.forEach(sym => marketSocket.emit('unsubscribe', sym));
      marketSocket.off('connect', onConnect);
      marketSocket.off('price', stableHandler);
    };
  }, []);

  // ── Build table rows ─────────────────────────────────────────────────────
  const tableRows: MarketRow[] = TABLE_COINS.map(sym => ({
    symbol:    sym,
    price:     prices[sym] ?? null,
    change24h: changes[sym] ?? 0,
    volume:    volumes[sym] ?? 0,
  }));

  return (
    <main style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 24px', display: 'grid', gap: 32 }}>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#E5E7EB', marginBottom: 6 }}>
          📊 Cryptocurrency Markets
        </h1>
        <p style={{ color: '#6B7280', fontSize: 15 }}>
          Live prices streaming directly from Binance
        </p>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          padding: '14px 18px', borderRadius: 10,
          background: 'rgba(255,77,79,0.1)', border: '1px solid rgba(255,77,79,0.3)',
          color: '#FF4D4F', fontSize: 14,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span>⚠ {error}</span>
          <button
            onClick={() => window.location.reload()}
            style={{ background:'none', border:'none', color:'#FF4D4F', cursor:'pointer', textDecoration:'underline', fontSize:13 }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Top price cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 20 }}>
        {TOP_CARDS.map(sym => (
          <PriceCard
            key={sym}
            symbol={sym}
            price={prices[sym] ?? null}
            change24h={changes[sym] ?? 0}
            isLoading={isLoading}
          />
        ))}
      </div>

      {/* Live chart */}
      <TradingChart
        data={chartData}
        symbol={CHART_SYMBOL}
        currentPrice={prices[CHART_SYMBOL] ?? null}
      />

      {/* Market table */}
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#E5E7EB', marginBottom: 16 }}>
          All Markets
        </h2>
        <MarketTable rows={tableRows} isLoading={isLoading} />
      </div>

    </main>
  );
}
