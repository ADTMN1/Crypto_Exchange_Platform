import { Router } from 'express';
import AdminOrderController from '../controllers/admin-order.controller.js';
import { authMiddleware, requireAdmin } from '../middleware/auth.midlware.js';

const router = Router();

// All admin order routes require authentication and admin role
router.use(authMiddleware, requireAdmin);

// Get all trades
router.get('/trades', AdminOrderController.getAllTrades);

// Get all orders
router.get('/', AdminOrderController.getAllOrders);

// Get open orders
router.get('/open', AdminOrderController.getOpenOrders);

// Get order history (filled/cancelled)
router.get('/history', AdminOrderController.getOrderHistory);

// Get single order
router.get('/:orderId', AdminOrderController.getOrderById);

// Cancel order
router.patch('/:orderId/cancel', AdminOrderController.cancelOrder);

export default router;
