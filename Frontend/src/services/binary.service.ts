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
  }
};

export default binaryService;
