import api, { API_ENDPOINTS } from './api.service';

export interface BinaryTrade {
  id: string;
  user_id: string;
  pair: string;
  direction: 'BUY' | 'SELL';
  amount: number;
  duration: number;
  entry_price: number;
  close_price?: number;
  status: 'running' | 'win' | 'lose' | 'expired';
  payout?: number;
  created_at: string;
  expires_at: string;
  resolved_at?: string;
}

export interface BinarySettings {
  id: string;
  is_enabled: boolean;
  payout_percentage: number;
  min_trade_amount: number;
  max_trade_amount: number;
  allowed_expirations: number[];
  allowed_pairs: string[];
  updated_at: string;
  updated_by?: string;
}

export interface PlaceTradeRequest {
  pair: string;
  direction: 'BUY' | 'SELL';
  amount: number;
  duration: number;
}

export interface PlaceTradeResponse {
  success: boolean;
  message: string;
  data: BinaryTrade;
}

export interface GetTradesResponse {
  success: boolean;
  message: string;
  data: {
    trades: BinaryTrade[];
    total: number;
    page: number;
    limit: number;
  };
}

export interface BinarySettingsResponse {
  success: boolean;
  message: string;
  data: BinarySettings;
}

const transformBinaryTrade = (trade: any): BinaryTrade => {
  return {
    ...trade,
    amount: Number(trade.amount),
    duration: Number(trade.duration),
    entry_price: Number(trade.entry_price),
    close_price: trade.close_price ? Number(trade.close_price) : undefined,
    payout: trade.payout ? Number(trade.payout) : undefined,
  };
};

const transformBinarySettings = (settings: any): BinarySettings => {
  return {
    ...settings,
    payout_percentage: Number(settings.payout_percentage),
    min_trade_amount: Number(settings.min_trade_amount),
    max_trade_amount: Number(settings.max_trade_amount),
    allowed_expirations: settings.allowed_expirations.map((e: any) => Number(e)),
  };
};

export const binaryService = {
  placeTrade: async (tradeData: PlaceTradeRequest): Promise<PlaceTradeResponse> => {
    console.log('Binary service placing trade at:', API_ENDPOINTS.BINARY.PLACE_TRADE, 'with data:', tradeData);
    const response = await api.post(API_ENDPOINTS.BINARY.PLACE_TRADE, tradeData);
    console.log('Binary service response:', response);
    return {
      ...response.data,
      data: transformBinaryTrade(response.data.data)
    };
  },

  getMyTrades: async (status?: string, page: number = 1): Promise<GetTradesResponse> => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    params.append('page', page.toString());
    
    const response = await api.get(`${API_ENDPOINTS.BINARY.MY_TRADES}?${params.toString()}`);
    return {
      ...response.data,
      data: {
        ...response.data.data,
        trades: response.data.data.trades.map(transformBinaryTrade)
      }
    };
  },

  getAdminTrades: async (status: string, page: number = 1): Promise<GetTradesResponse> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    
    const response = await api.get(`${API_ENDPOINTS.BINARY.ADMIN_TRADES(status)}?${params.toString()}`);
    return {
      ...response.data,
      data: {
        ...response.data.data,
        trades: response.data.data.trades.map(transformBinaryTrade)
      }
    };
  },

  getSettings: async (): Promise<BinarySettingsResponse> => {
    const response = await api.get(API_ENDPOINTS.BINARY.SETTINGS);
    return {
      ...response.data,
      data: transformBinarySettings(response.data.data)
    };
  },

  updateSettings: async (settings: Partial<BinarySettings>): Promise<BinarySettingsResponse> => {
    const response = await api.put(API_ENDPOINTS.BINARY.UPDATE_SETTINGS, settings);
    return {
      ...response.data,
      data: transformBinarySettings(response.data.data)
    };
  }
};

export default binaryService;
