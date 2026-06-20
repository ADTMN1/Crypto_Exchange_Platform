import axios from 'axios';
import AppError from '../utils/errorHandling.js';

const COINGECKO_API = 'https://api.coingecko.com/api/v3';

// Map trading pairs to CoinGecko IDs
const PAIR_TO_COINGECKO_ID = {
  'BTC/USDT': 'bitcoin',
  'ETH/USDT': 'ethereum',
  'BNB/USDT': 'binancecoin',
  'SOL/USDT': 'solana',
};

// Helper to normalize pair (e.g., "BTCUSDT" → "BTC/USDT")
const normalizePair = (pair) => {
  if (pair.includes('/')) return pair;
  // Try to insert slash before USDT
  if (pair.endsWith('USDT')) {
    const base = pair.slice(0, -4);
    return `${base}/USDT`;
  }
  return pair;
};

const priceService = {
  /**
   * Get current price for a trading pair
   * @param {string} pair - Trading pair (e.g., 'BTC/USDT' or 'BTCUSDT')
   * @returns {number} Current price
   */
  getPrice: async (pair) => {
    const normalizedPair = normalizePair(pair);
    const coinId = PAIR_TO_COINGECKO_ID[normalizedPair];
    
    if (!coinId) {
      throw new AppError(`Unsupported trading pair: ${pair}`, 400);
    }

    try {
      const response = await axios.get(`${COINGECKO_API}/simple/price`, {
        params: {
          ids: coinId,
          vs_currencies: 'usd',
        },
        timeout: 5000,
      });

      const price = response.data[coinId]?.usd;

      if (!price) {
        throw new AppError('Failed to fetch price from CoinGecko', 500);
      }

      return price;
    } catch (error) {
      if (error.response) {
        throw new AppError(`CoinGecko API error: ${error.response.status}`, 500);
      } else if (error.request) {
        throw new AppError('Failed to connect to price service', 500);
      }
      throw error;
    }
  },

  /**
   * Get supported trading pairs
   * @returns {string[]} Array of supported pairs
   */
  getSupportedPairs: () => {
    return Object.keys(PAIR_TO_COINGECKO_ID);
  },
};

export default priceService;
