import api from './api.service'

interface Balance {
  currency: string
  available: number
  locked: number
  total: number
}

interface Transaction {
  id: string
  type: 'deposit' | 'withdrawal'
  currency: string
  amount: string
  status: 'pending' | 'completed' | 'failed'
  created_at: string
}

const walletService = {
  /**
   * Get wallet balances
   */
  async getBalance(): Promise<Balance[]> {
    const response = await api.get('/wallet/balance')
    return response.data
  },

  /**
   * Deposit funds
   */
  async deposit(data: { amount: number; currency: string }): Promise<any> {
    const response = await api.post('/wallet/deposit', data)
    return response.data
  },

  /**
   * Withdraw funds
   */
  async withdraw(data: { amount: number; currency: string; address: string }): Promise<any> {
    const response = await api.post('/wallet/withdraw', data)
    return response.data
  },

  /**
   * Get transaction history
   */
  async getTransactions(): Promise<Transaction[]> {
    const response = await api.get('/wallet/transactions')
    return response.data
  },
}

export default walletService
