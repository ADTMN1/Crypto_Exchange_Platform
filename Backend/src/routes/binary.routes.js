import express from 'express';
import binaryController from '../controllers/binary.controller.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.midlware.js';

const binaryRouter = express.Router();

// All routes require authentication
binaryRouter.use(authenticateToken);

// ─── USER ROUTES ────────────────────────────────────────────────────────────
binaryRouter.post('/trade',         binaryController.placeTrade);
binaryRouter.get('/my-trades',      binaryController.getMyTrades);

// ─── ADMIN ROUTES ───────────────────────────────────────────────────────────
binaryRouter.get('/admin/trades/:status', requireAdmin, binaryController.getAdminTrades);

export default binaryRouter;
