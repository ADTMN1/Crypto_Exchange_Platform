import api from './api.service';

export interface MarketPrice {
  symbol: string;
  price: number;
}

export interface MarketPricesResponse {
  success: boolean;
  count: number;
  data: MarketPrice[];
}

export interface MarketPriceResponse {
  success: boolean;
  data: MarketPrice;
}

export interface MarketOverview {
  symbol: string;
  price: number;
  change24h?: number;
  volume24h?: number;
}

export interface MarketOverviewResponse {
  success: boolean;
  data: MarketOverview[];
}

export interface HistoryPoint {
  time: number;   // UTC seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface HistoryResponse {
  success: boolean;
  data: HistoryPoint[];
}

export interface CoinsResponse {
  success: boolean;
  count: number;
  data: string[];
}

const marketApi = {
  /**
   * GET /api/market/price?symbol=BTCUSDT
   */
  getMarketPrice: async (symbol: string = 'BTCUSDT'): Promise<MarketPrice> => {
    const response = await api.get<MarketPriceResponse>('/market/price', {
      params: { symbol: symbol.toUpperCase() },
    });
    return response.data.data;
  },

  /**
   * GET /api/market/price/:symbol
   */
  getMarketPriceBySymbol: async (symbol: string): Promise<MarketPrice> => {
    const response = await api.get<MarketPriceResponse>(
      `/market/price/${symbol.toUpperCase()}`
    );
    return response.data.data;
  },

  /**
   * GET /api/market/prices — all supported coins
   */
  getAllPrices: async (): Promise<MarketPrice[]> => {
    const response = await api.get<MarketPricesResponse>('/market/prices');
    return response.data.data;
  },

  /**
   * GET /api/market/overview
   */
  getMarketOverview: async (): Promise<MarketOverview[]> => {
    const response = await api.get<MarketOverviewResponse>('/market/overview');
    return response.data.data;
  },

  /**
   * GET /api/market/history/:symbol?interval=1m&limit=100
   */
  getMarketHistory: async (symbol: string, interval = '1m', limit = 100): Promise<HistoryPoint[]> => {
    const response = await api.get<HistoryResponse>(`/market/history/${symbol.toUpperCase()}`, {
      params: { interval, limit },
    });
    return response.data.data;
  },

  /**
   * GET /api/market/coins — supported symbol list
   */
  getCoins: async (): Promise<string[]> => {
    const response = await api.get<CoinsResponse>('/market/coins');
    return response.data.data;
  },
};

export default marketApi;
