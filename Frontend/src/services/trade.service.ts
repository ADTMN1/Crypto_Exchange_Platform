import api from './api.service'
import type { OrderBookResponse } from '../types/trade.types'

const tradeService = {
  async fetchOrderBook(pair: string): Promise<OrderBookResponse> {
    const response = await api.get<OrderBookResponse>(`/trade/${pair}/order-book`)
    return response.data
  },
}

export default tradeService
