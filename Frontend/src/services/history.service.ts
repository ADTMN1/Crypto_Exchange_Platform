import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface HistoryFilters {
  type?: 'deposit' | 'withdrawal';
  status?: string;
  pair?: string;
  limit?: number;
  offset?: number;
}

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal';
  currency: string;
  amount: string;
  fee: string;
  status: 'pending' | 'completed' | 'failed';
  tx_hash?: string;
  from_address?: string;
  to_address?: string;
  confirmations: number;
  created_at: string;
  confirmed_at?: string;
}

export interface Trade {
  id: string;
  pair: string;
  base_currency: string;
  quote_currency: string;
  side: 'buy' | 'sell';
  price: string;
  quantity: string;
  total: string;
  fee: string;
  executed_at: string;
}

export interface Order {
  id: string;
  pair: string;
  base_currency: string;
  quote_currency: string;
  type: 'market' | 'limit';
  side: 'buy' | 'sell';
  status: 'open' | 'partially_filled' | 'filled' | 'cancelled';
  price?: string;
  quantity: string;
  filled_qty: string;
  avg_fill_price: string;
  fee: string;
  fee_currency?: string;
  created_at: string;
  updated_at: string;
  cancelled_at?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

export interface HistorySummary {
  success: boolean;
  data: {
    transactions: Array<{ count: string; type: string }>;
    trades: number;
    orders: Array<{ count: string; status: string }>;
    totalVolume30d: string;
  };
}

const historyService = {
  /**
   * Get transaction history (deposits & withdrawals)
   */
  getTransactions: async (filters: HistoryFilters = {}): Promise<PaginatedResponse<Transaction>> => {
    const params = new URLSearchParams();
    
    if (filters.type) params.append('type', filters.type);
    if (filters.status) params.append('status', filters.status);
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.offset) params.append('offset', filters.offset.toString());

    const response = await axios.get(`${API_URL}/history/transactions?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    return response.data;
  },

  /**
   * Get trade history
   */
  getTrades: async (filters: HistoryFilters = {}): Promise<PaginatedResponse<Trade>> => {
    const params = new URLSearchParams();
    
    if (filters.pair) params.append('pair', filters.pair);
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.offset) params.append('offset', filters.offset.toString());

    const response = await axios.get(`${API_URL}/history/trades?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    return response.data;
  },

  /**
   * Get order history
   */
  getOrders: async (filters: HistoryFilters = {}): Promise<PaginatedResponse<Order>> => {
    const params = new URLSearchParams();
    
    if (filters.status) params.append('status', filters.status);
    if (filters.pair) params.append('pair', filters.pair);
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.offset) params.append('offset', filters.offset.toString());

    const response = await axios.get(`${API_URL}/history/orders?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    return response.data;
  },

  /**
   * Get history summary
   */
  getSummary: async (): Promise<HistorySummary> => {
    const response = await axios.get(`${API_URL}/history/summary`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    return response.data;
  },
};

export default historyService;
