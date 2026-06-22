import AppError from '../utils/errorHandling.js';
import binanceService from './binance.service.js';

// Helper to normalize pair (e.g., "BTC/USDT" → "BTCUSDT")
const normalizePair = (pair) => {
  if (!pair.includes('/')) return pair;
  // Remove slash: "BTC/USDT" → "BTCUSDT"
  return pair.replace('/', '');
};

const priceService = {
  /**
   * Get current price for a trading pair
   * @param {string} pair - Trading pair (e.g., 'BTC/USDT' or 'BTCUSDT')
   * @returns {number} Current price
   */
  getPrice: async (pair) => {
    try {
      const normalizedPair = normalizePair(pair);
      const priceData = await binanceService.getPrice(normalizedPair);
      return priceData.price;
    } catch (error) {
      console.error('Error fetching price from Binance:', error.message);
      throw error;
    }
  },

  /**
   * Get supported trading pairs
   * @returns {string[]} Array of supported pairs
   */
  getSupportedPairs: () => {
    return binanceService.getSupportedSymbols().map(symbol => {
      // Convert "BTCUSDT" to "BTC/USDT" for display
      if (symbol.endsWith('USDT')) {
        return `${symbol.slice(0, -4)}/USDT`;
      }
      return symbol;
    });
  },
};

export default priceService;
