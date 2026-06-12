import api from './api.service';

export interface PlaceTradeRequest {
  pair: string;
  direction: 'UP' | 'DOWN';
  amount: number;
  duration: number;
}

export interface BinaryTrade {
  id: string;
  user_id: string;
  pair: string;
  direction: 'UP' | 'DOWN';
  amount: string;
  duration: number;
  entry_price: string;
  close_price?: string;
  status: 'running' | 'win' | 'lose';
  payout: string;
  created_at: string;
  expires_at: string;
  resolved_at?: string;
}

const binaryService = {
  // ─── USER ENDPOINTS ─────────────────────────────────────────────────────────

  /**
   * Place a binary trade
   * @param tradeData - Trade parameters
   */
  placeTrade: async (tradeData: PlaceTradeRequest) => {
    const response = await api.post('/binary/trade', tradeData);
    return response.data;
  },

  /**
   * Get user's binary trades
   * @param status - Filter by status: 'running' | 'win' | 'lose' | 'all'
   * @param page - Page number
   */
  getMyTrades: async (status?: string, page: number = 1) => {
    const response = await api.get('/binary/my-trades', {
      params: { status, page },
    });
    return response.data;
  },

  // ─── ADMIN ENDPOINTS ────────────────────────────────────────────────────────

  /**
   * Admin: Get all binary trades by status
   * @param status - 'running' | 'win' | 'lose' | 'all'
   * @param page - Page number
   */
  getAdminTrades: async (status: string, page: number = 1) => {
    const response = await api.get(`/binary/admin/trades/${status}`, {
      params: { page },
    });
    return response.data;
  },
};

export default binaryService;
