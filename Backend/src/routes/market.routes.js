import express from 'express';
import {
  getMarketStats,
  getKlines,
  getOrderBook,
  getRecentTrades,
  getAllTickers,
  getExchangeInfo,
  saveFavoriteSymbols,
  getFavoriteSymbols,
  getAllPrices,
  getMarketPrice,
  getCoins
} from '../controllers/market.controller.js';
import { authMiddleware } from '../middleware/auth.midlware.js';

const marketRouter = express.Router();

// Trading-focused routes (public)
marketRouter.get('/stats/:symbol', getMarketStats);
marketRouter.get('/klines/:symbol', getKlines);
marketRouter.get('/orderbook/:symbol', getOrderBook);
marketRouter.get('/trades/:symbol', getRecentTrades);
marketRouter.get('/tickers', getAllTickers);
marketRouter.get('/overview', getAllTickers);
marketRouter.get('/exchangeinfo', getExchangeInfo);
marketRouter.get('/prices', getAllPrices);
marketRouter.get('/price', getMarketPrice);
marketRouter.get('/price/:symbol', getMarketPrice);
marketRouter.get('/coins', getCoins);

// Protected routes (require authentication)
marketRouter.post('/favorites', authMiddleware, saveFavoriteSymbols);
marketRouter.get('/favorites', authMiddleware, getFavoriteSymbols);

export default marketRouter;
