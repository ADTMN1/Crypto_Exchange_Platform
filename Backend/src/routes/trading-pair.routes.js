import express from 'express';
import tradingPairController from '../controllers/trading-pair.controller.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.midlware.js';

const tradingPairRouter = express.Router();

// Public route - get all active pairs
tradingPairRouter.get('/', tradingPairController.getAllPairs);

// Admin routes
tradingPairRouter.use(authenticateToken);
tradingPairRouter.use(requireAdmin);

tradingPairRouter.post('/', tradingPairController.createPair);
tradingPairRouter.get('/:id', tradingPairController.getPairById);
tradingPairRouter.put('/:id', tradingPairController.updatePair);
tradingPairRouter.delete('/:id', tradingPairController.deletePair);

export default tradingPairRouter;
