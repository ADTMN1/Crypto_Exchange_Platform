import express from 'express';
import binaryController from '../controllers/binary.controller.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.midlware.js';

const binaryRouter = express.Router();

// ─── PUBLIC ROUTE ───────────────────────────────────────────────────────────
binaryRouter.get('/settings', binaryController.getSettings);

// All routes below require authentication
binaryRouter.use(authenticateToken);

// ─── USER ROUTES ────────────────────────────────────────────────────────────
// Note: gate check intentionally removed — gate closed = lose at resolution, not block placement
binaryRouter.post('/trade', binaryController.placeTrade);
binaryRouter.get('/my-trades', binaryController.getMyTrades);

// ─── ADMIN ROUTES ───────────────────────────────────────────────────────────
binaryRouter.get('/admin/trades/:status', requireAdmin, binaryController.getAdminTrades);
binaryRouter.put('/admin/settings', requireAdmin, binaryController.updateSettings);

export default binaryRouter;
