import { createContext, useContext } from 'react';
import io, { Socket } from 'socket.io-client';

// Empty string = same origin; Vite dev proxy forwards /api → backend
export const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

export interface MarketStats {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  volumeQuote24h: number;
}

export interface TickerItem {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  volumeQuote24h: number;
}

export interface KlineCandle {
  openTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  closeTime: number;
}

export interface KlineUpdate {
  symbol: string;
  interval: string;
  openTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  isFinal: boolean;
}

export interface DepthLevel {
  price: number;
  quantity: number;
}

export interface RecentTrade {
  id: number;
  price: number;
  quantity: number;
  timestamp: number;
  isBuyerMaker: boolean;
}

export interface PriceUpdate {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: number;
}

/** How many days of history to load per chart interval */
export function historyDaysForInterval(interval: string): number {
  const map: Record<string, number> = {
    '1m': 3,
    '5m': 30,
    '15m': 180,
    '1h': 365,
    '4h': 730,
    '1d': 1825,
    '1w': 3650,
  };
  return map[interval] ?? 180;
}

export async function apiGet<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`);
    if (!res.ok) return null;
    const json = await res.json();
    return json.success ? json.data : null;
  } catch {
    return null;
  }
}

let socket: Socket | null = null;
let refCount = 0;

export function getMarketSocket() {
  if (!socket) {
    const raw = import.meta.env.VITE_WS_URL;
    const url = raw
      ? raw.replace(/^ws:/, 'http:').replace(/^wss:/, 'https:')
      : undefined; // same origin → Vite proxies /socket.io
    socket = io(url, { transports: ['websocket', 'polling'], autoConnect: true });
  }
  return socket;
}

export function releaseMarketSocket() {
  refCount--;
  if (refCount <= 0 && socket) {
    socket.disconnect();
    socket = null;
    refCount = 0;
  }
}

export function acquireMarketSocket() {
  refCount++;
  return getMarketSocket();
}

export interface MarketDataContextValue {
  symbol: string;
  interval: string;
  setSymbol: (s: string) => void;
  setChartInterval: (i: string) => void;
  stats: MarketStats | null;
  tickers: TickerItem[];
  klines: KlineCandle[];
  kline: KlineUpdate | null;
  depth: { bids: DepthLevel[]; asks: DepthLevel[] } | null;
  trades: RecentTrade[];
  livePrice: number;
  priceDirection: 'up' | 'down';
  isConnected: boolean;
  klinesLoading: boolean;
  refreshKlines: () => void;
  loadMoreKlines: () => Promise<void>;
}

export const MarketDataContext = createContext<MarketDataContextValue | null>(null);

export function useMarketData() {
  const ctx = useContext(MarketDataContext);
  if (!ctx) throw new Error('useMarketData must be used within MarketDataProvider');
  return ctx;
}
