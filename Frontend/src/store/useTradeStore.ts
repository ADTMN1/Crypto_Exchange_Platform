import { create } from 'zustand'
import type { TradePair } from '../types/trade.types'

interface TradeState {
  activePair: TradePair | null
  setActivePair: (pair: TradePair) => void
}

export const useTradeStore = create<TradeState>((set) => ({
  activePair: null,
  setActivePair: (pair) => set({ activePair: pair }),
}))
