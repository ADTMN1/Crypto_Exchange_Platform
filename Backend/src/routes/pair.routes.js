import express from 'express';
import pairController from '../controllers/pair.controller.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.midlware.js';

const pairRouter = express.Router();

// ─── ADMIN ROUTES (mounted at /api/admin) ──────────────────────────────────
pairRouter.get('/pairs', authenticateToken, requireAdmin, pairController.getAllPairs);
pairRouter.get('/pairs/:id', authenticateToken, requireAdmin, pairController.getPair);
pairRouter.post('/pairs', authenticateToken, requireAdmin, pairController.createPair);
pairRouter.put('/pairs/:id', authenticateToken, requireAdmin, pairController.updatePair);
pairRouter.patch('/pairs/:id/status', authenticateToken, requireAdmin, pairController.updateStatus);
pairRouter.delete('/pairs/:id', authenticateToken, requireAdmin, pairController.deletePair);

export default pairRouter;
