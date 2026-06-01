import api from './api.service'
import type { WalletBalance } from '../types/wallet.types'

const walletService = {
  async getBalance(): Promise<WalletBalance> {
    const response = await api.get<WalletBalance>('/wallet/balance')
    return response.data
  },
}

export default walletService
