import express from 'express';
import p2pController from '../controllers/p2p.controller.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.midlware.js';

const p2pRouter = express.Router();

// All routes require authentication
p2pRouter.use(authenticateToken);

// ─── OFFER ROUTES ───────────────────────────────────────────────────────────
p2pRouter.post('/offer',            p2pController.createOffer);
p2pRouter.get('/offers',            p2pController.getOffers);

// ─── ORDER ROUTES ───────────────────────────────────────────────────────────
p2pRouter.post('/order',            p2pController.placeOrder);
p2pRouter.get('/orders',            p2pController.getMyOrders);
p2pRouter.post('/order/:id/paid',   p2pController.markAsPaid);
p2pRouter.post('/order/:id/release', p2pController.releaseCrypto);
p2pRouter.post('/order/:id/cancel', p2pController.cancelOrder);
p2pRouter.post('/order/:id/dispute', p2pController.raiseDispute);

// ─── ADMIN ROUTES ───────────────────────────────────────────────────────────
p2pRouter.get('/admin/orders',              requireAdmin, p2pController.getAllOrders);
p2pRouter.get('/admin/disputes',            requireAdmin, p2pController.getDisputes);
p2pRouter.post('/admin/dispute/:id/resolve', requireAdmin, p2pController.resolveDispute);

export default p2pRouter;
