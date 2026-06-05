import express from 'express';
import marketController from '../controllers/market.controller.js';
import { authenticateToken } from '../middleware/auth.midlware.js';

const marketRouter = express.Router();

marketRouter.use(authenticateToken);

// GET /api/market/coins
marketRouter.get('/coins',            marketController.getSupportedCoins);

// GET /api/market/prices
marketRouter.get('/prices',           marketController.getAllPrices);

// GET /api/market/overview
marketRouter.get('/overview',         marketController.getOverview);

// GET /api/market/history/:symbol
marketRouter.get('/history/:symbol',  marketController.getHistory);

// GET /api/market/price
marketRouter.get('/price',            marketController.getPrice);

// GET /api/market/price/:symbol
marketRouter.get('/price/:symbol',    marketController.getPriceBySymbol);

export default marketRouter;
