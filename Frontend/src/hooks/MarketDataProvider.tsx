import { useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import {
  MarketDataContext,
  acquireMarketSocket,
  releaseMarketSocket,
  apiGet,
  historyDaysForInterval,
  type MarketStats,
  type TickerItem,
  type KlineCandle,
  type KlineUpdate,
  type DepthLevel,
  type RecentTrade,
  type PriceUpdate,
} from './useMarketData';

export function MarketDataProvider({
  children,
  initialSymbol = 'BTCUSDT',
  initialInterval = '30s',
}: {
  children: ReactNode;
  initialSymbol?: string;
  initialInterval?: string;
}) {
  const [symbol, setSymbol] = useState(initialSymbol);
  const [interval, setIntervalState] = useState(initialInterval);
  const [stats, setStats] = useState<MarketStats | null>(null);
  const [tickers, setTickers] = useState<TickerItem[]>([]);
  const [klines, setKlines] = useState<KlineCandle[]>([]);
  const [kline, setKline] = useState<KlineUpdate | null>(null);
  const [depth, setDepth] = useState<{ bids: DepthLevel[]; asks: DepthLevel[] } | null>(null);
  const [trades, setTrades] = useState<RecentTrade[]>([]);
  const [livePrice, setLivePrice] = useState(0);
  const [priceDirection, setPriceDirection] = useState<'up' | 'down'>('up');
  const [isConnected, setIsConnected] = useState(false);
  const [klinesLoading, setKlinesLoading] = useState(false);
  const prevPriceRef = useRef(0);
  const loadingMoreRef = useRef(false);

  const fetchKlines = useCallback(async () => {
    setKlinesLoading(true);

    if (interval === '30s') {
      const data = await apiGet<KlineCandle[]>(
        `/api/market/klines/${symbol}?interval=30s&limit=1000`
      );
      if (data) setKlines(data);
      setKlinesLoading(false);
      return;
    }

    const days = historyDaysForInterval(interval);
    const data = await apiGet<KlineCandle[]>(
      `/api/market/klines/${symbol}?interval=${interval}&days=${days}`
    );
    if (data) setKlines(data);
    setKlinesLoading(false);
  }, [symbol, interval]);

  const refreshKlines = useCallback(() => { fetchKlines(); }, [fetchKlines]);

  const loadMoreKlines = useCallback(async () => {
    if (loadingMoreRef.current || klines.length === 0) return;
    loadingMoreRef.current = true;

    const oldest = klines[0].openTime;

    if (interval === '30s') {
      const older = await apiGet<KlineCandle[]>(
        `/api/market/klines/${symbol}?interval=30s&limit=1000&before=${oldest}`
      );
      if (older?.length) {
        const merged = new Map<number, KlineCandle>();
        for (const c of [...older, ...klines]) merged.set(c.openTime, c);
        setKlines([...merged.values()].sort((a, b) => a.openTime - b.openTime));
      }
      loadingMoreRef.current = false;
      return;
    }

    const days = 90;
    const older = await apiGet<KlineCandle[]>(
      `/api/market/klines/${symbol}?interval=${interval}&days=${days}&before=${oldest}`
    );
    if (older?.length) {
      const merged = new Map<number, KlineCandle>();
      for (const c of [...older, ...klines]) merged.set(c.openTime, c);
      setKlines([...merged.values()].sort((a, b) => a.openTime - b.openTime));
    }
    loadingMoreRef.current = false;
  }, [symbol, interval, klines]);

  useEffect(() => {
    apiGet<MarketStats>(`/api/market/stats/${symbol}`).then(setStats);
    apiGet<TickerItem[]>('/api/market/tickers').then((d) => { if (d) setTickers(d); });
    fetchKlines();
    apiGet<{ bids: DepthLevel[]; asks: DepthLevel[] }>(
      `/api/market/orderbook/${symbol}?limit=20`
    ).then((d) => { if (d) setDepth(d); });
    apiGet<RecentTrade[]>(`/api/market/trades/${symbol}?limit=30`).then((d) => {
      if (d) setTrades(d);
    });

    const tradePoll = window.setInterval(() => {
      apiGet<RecentTrade[]>(`/api/market/trades/${symbol}?limit=30`).then((d) => {
        if (d) setTrades(d);
      });
    }, 10000);
    return () => window.clearInterval(tradePoll);
  }, [symbol, fetchKlines]);

  useEffect(() => {
    const s = acquireMarketSocket();
    const sym = symbol.toLowerCase();

    const onConnect = () => {
      setIsConnected(true);
      s.emit('subscribe', { symbol: sym, interval });
    };

    const onPrice = (data: PriceUpdate) => {
      if (data.symbol.toLowerCase() !== sym) return;
      setLivePrice(data.price);
      if (prevPriceRef.current) {
        setPriceDirection(data.price >= prevPriceRef.current ? 'up' : 'down');
      }
      prevPriceRef.current = data.price;
      setStats((prev) => prev ? {
        ...prev,
        price: data.price,
        change24h: data.change,
        changePercent24h: data.changePercent,
      } : prev);
    };

    const onKline = (data: KlineUpdate) => {
      if (data.symbol.toLowerCase() !== sym || data.interval !== interval) return;
      setKline(data);
      setLivePrice(data.close);
      if (prevPriceRef.current) {
        setPriceDirection(data.close >= prevPriceRef.current ? 'up' : 'down');
      }
      prevPriceRef.current = data.close;
    };

    const onDepth = (data: { symbol: string; bids: DepthLevel[]; asks: DepthLevel[] }) => {
      if (data.symbol.toLowerCase() !== sym) return;
      setDepth({ bids: data.bids, asks: data.asks });
    };

    s.on('connect', onConnect);
    s.on('disconnect', () => setIsConnected(false));
    s.on('priceUpdate', onPrice);
    s.on('klineUpdate', onKline);
    s.on('depthUpdate', onDepth);

    if (s.connected) onConnect();

    return () => {
      s.off('connect', onConnect);
      s.off('priceUpdate', onPrice);
      s.off('klineUpdate', onKline);
      s.off('depthUpdate', onDepth);
      s.emit('unsubscribe', { symbol: sym, interval });
      releaseMarketSocket();
    };
  }, [symbol, interval]);

  useEffect(() => {
    const s = acquireMarketSocket();
    if (s.connected) {
      s.emit('subscribeKline', { symbol: symbol.toLowerCase(), interval });
    }
  }, [symbol, interval]);

  useEffect(() => {
    if (stats?.price) {
      setLivePrice(stats.price);
      prevPriceRef.current = stats.price;
    }
  }, [stats?.price, symbol]);

  const setChartInterval = (i: string) => setIntervalState(i);

  return (
    <MarketDataContext.Provider value={{
      symbol, interval, setSymbol, setChartInterval,
      stats, tickers, klines, kline, depth, trades,
      livePrice, priceDirection, isConnected, klinesLoading,
      refreshKlines, loadMoreKlines,
    }}>
      {children}
    </MarketDataContext.Provider>
  );
}
