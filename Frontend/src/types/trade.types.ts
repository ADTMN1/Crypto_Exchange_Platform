export interface TradePair {
  base: string
  quote: string
  symbol: string
}

export interface OrderBookResponse {
  asks: Array<[number, number]>
  bids: Array<[number, number]>
}
