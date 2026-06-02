import { Router } from 'express';
import HistoryController from '../controllers/history.controller.js';
import { authMiddleware } from '../middleware/auth.midlware.js';

const router = Router();

// All history routes require authentication
router.use(authMiddleware);

// Get transaction history (deposits & withdrawals)
// Query params: type, status, limit, offset
// GET /api/history/transactions?type=deposit&status=completed&limit=20&offset=0
router.get('/transactions', HistoryController.getTransactions);

// Get trade history
// Query params: pair, limit, offset
// GET /api/history/trades?pair=BTC/USDT&limit=20&offset=0
router.get('/trades', HistoryController.getTrades);

// Get order history
// Query params: status, pair, limit, offset
// GET /api/history/orders?status=filled&limit=20&offset=0
router.get('/orders', HistoryController.getOrders);

// Get history summary (counts and stats)
// GET /api/history/summary
router.get('/summary', HistoryController.getSummary);

export default router;
