import api, { API_ENDPOINTS } from './api.service'
import type { OrderBookResponse } from '../types/trade.types'

const tradeService = {
  async fetchOrderBook(pair: string): Promise<OrderBookResponse> {
    const response = await api.get<OrderBookResponse>(API_ENDPOINTS.TRADE.ORDER_BOOK(pair))
    return response.data
  },
  async placeOrder(orderData: any): Promise<any> {
    const response = await api.post(API_ENDPOINTS.TRADE.PLACE_ORDER, orderData)
    return response.data
  },
  async cancelOrder(orderId: string): Promise<void> {
    await api.delete(API_ENDPOINTS.TRADE.CANCEL_ORDER(orderId))
  },
  async getOrderHistory(): Promise<any[]> {
    const response = await api.get(API_ENDPOINTS.TRADE.ORDER_HISTORY)
    return response.data
  },
  async getMarketData(): Promise<any> {
    const response = await api.get(API_ENDPOINTS.TRADE.MARKET_DATA)
    return response.data
  },
}

export default tradeService
