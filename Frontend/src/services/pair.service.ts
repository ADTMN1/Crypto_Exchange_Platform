import api from './api.service';

export interface TradingPair {
  id: string;
  base_currency: string;
  quote_currency: string;
  symbol: string;
  min_order_size: string;
  max_order_size: string;
  price_precision: number;
  qty_precision: number;
  maker_fee: string;
  taker_fee: string;
  is_active: boolean;
  current_price?: number | null;
}

const pairService = {
  // ─── ADMIN ENDPOINTS ────────────────────────────────────────────────────────

  /**
   * Get all trading pairs (admin)
   * @param includeInactive - Include inactive pairs
   */
  getAllPairs: async (includeInactive: boolean = true) => {
    const response = await api.get('/admin/pairs', {
      params: { includeInactive: includeInactive ? 'true' : 'false' },
    });
    return response.data;
  },

  /**
   * Get single trading pair by ID (admin)
   * @param id - Pair UUID
   */
  getPair: async (id: string) => {
    const response = await api.get(`/admin/pairs/${id}`);
    return response.data;
  },

  /**
   * Create new trading pair (admin)
   */
  createPair: async (data: {
    base_currency: string;
    quote_currency: string;
    min_order_size?: string;
    max_order_size?: string;
    price_precision?: number;
    qty_precision?: number;
    maker_fee?: string;
    taker_fee?: string;
    is_active?: boolean;
  }) => {
    const response = await api.post('/admin/pairs', data);
    return response.data;
  },

  /**
   * Update trading pair (admin)
   */
  updatePair: async (
    id: string,
    data: {
      base_currency?: string;
      quote_currency?: string;
      min_order_size?: string;
      max_order_size?: string;
      price_precision?: number;
      qty_precision?: number;
      maker_fee?: string;
      taker_fee?: string;
      is_active?: boolean;
    }
  ) => {
    const response = await api.put(`/admin/pairs/${id}`, data);
    return response.data;
  },

  /**
   * Update pair status (admin)
   */
  updateStatus: async (id: string, is_active: boolean) => {
    const response = await api.patch(`/admin/pairs/${id}/status`, {
      is_active,
    });
    return response.data;
  },

  /**
   * Delete trading pair (admin)
   */
  deletePair: async (id: string) => {
    const response = await api.delete(`/admin/pairs/${id}`);
    return response.data;
  },

  // ─── USER ENDPOINTS ─────────────────────────────────────────────────────────

  /**
   * Get enabled trading pairs (user)
   */
  getEnabledPairs: async () => {
    const response = await api.get('/trading/pairs');
    return response.data;
  },
};

export default pairService;
