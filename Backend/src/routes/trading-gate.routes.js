import express from 'express';
import tradingGateController from '../controllers/trading-gate.controller.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.midlware.js';

const tradingGateRouter = express.Router();

// ─── PUBLIC ROUTES ──────────────────────────────────────────────────────────
// Get current trading gate status (no auth required)
tradingGateRouter.get('/status', tradingGateController.getStatus);

// ─── ADMIN ONLY ROUTES ──────────────────────────────────────────────────────
// All admin routes require authentication and admin privileges
tradingGateRouter.use(authenticateToken);
tradingGateRouter.use(requireAdmin);

// Open the trading gate
tradingGateRouter.post('/open', tradingGateController.openGate);

// Close the trading gate  
tradingGateRouter.post('/close', tradingGateController.closeGate);

// Get detailed gate information (admin only)
tradingGateRouter.get('/details', tradingGateController.getGateDetails);

export default tradingGateRouter;