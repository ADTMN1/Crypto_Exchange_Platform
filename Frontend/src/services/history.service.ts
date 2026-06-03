import api from './api.service'

interface Transaction {
  id: string
  type: 'deposit' | 'withdrawal'
  currency: string
  amount: string
  status: string
  created_at: string
}

interface Trade {
  id: string
  pair: string
  type: 'buy' | 'sell'
  price: string
  amount: string
  total: string
  created_at: string
}

interface Order {
  id: string
  pair: string
  type: 'buy' | 'sell'
  order_type: 'market' | 'limit'
  price: string
  amount: string
  status: string
  created_at: string
}

interface HistorySummary {
  total_transactions: number
  total_trades: number
  total_orders: number
  total_volume: string
}

interface HistoryFilters {
  type?: 'deposit' | 'withdrawal'
  status?: string
  pair?: string
  limit?: number
  offset?: number
}

const historyService = {
  /**
   * Get transaction history (deposits & withdrawals)
   */
  async getTransactions(filters: HistoryFilters = {}): Promise<{ data: Transaction[] }> {
    const response = await api.get('/history/transactions', { params: filters })
    return response.data
  },

  /**
   * Get trade history
   */
  async getTrades(filters: HistoryFilters = {}): Promise<{ data: Trade[] }> {
    const response = await api.get('/history/trades', { params: filters })
    return response.data
  },

  /**
   * Get order history
   */
  async getOrders(filters: HistoryFilters = {}): Promise<{ data: Order[] }> {
    const response = await api.get('/history/orders', { params: filters })
    return response.data
  },

  /**
   * Get history summary statistics
   */
  async getSummary(): Promise<HistorySummary> {
    const response = await api.get('/history/summary')
    return response.data
  },
}

export default historyService
