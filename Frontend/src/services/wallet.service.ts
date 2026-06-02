import api, { API_ENDPOINTS } from './api.service'
import type { WalletBalance } from '../types/wallet.types'

const walletService = {
  async getBalance(): Promise<WalletBalance> {
    const response = await api.get<WalletBalance>(API_ENDPOINTS.WALLET.BALANCE)
    return response.data
  },
  async deposit(data: { amount: number; currency: string }): Promise<any> {
    const response = await api.post(API_ENDPOINTS.WALLET.DEPOSIT, data)
    return response.data
  },
  async withdraw(data: { amount: number; currency: string; address: string }): Promise<any> {
    const response = await api.post(API_ENDPOINTS.WALLET.WITHDRAW, data)
    return response.data
  },
  async getTransactions(filters?: any): Promise<any[]> {
    const response = await api.get(API_ENDPOINTS.WALLET.TRANSACTIONS, { params: filters })
    return response.data
  },
}

export default walletService
