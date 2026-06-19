import express from 'express';
import walletController from '../controllers/wallet.controller.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.midlware.js';

const walletRouter = express.Router();

// All routes require authentication
walletRouter.use(authenticateToken);

// ─── USER ROUTES ────────────────────────────────────────────────────────────
walletRouter.get('/balance',        walletController.getBalance);
walletRouter.get('/transactions',   walletController.getTransactions);

// ─── ADMIN ROUTES ───────────────────────────────────────────────────────────
walletRouter.get('/admin/wallets',        requireAdmin, walletController.getAllWallets);
walletRouter.post('/admin/topup',         requireAdmin, walletController.adminTopup);
walletRouter.post('/admin/debit',         requireAdmin, walletController.adminDebit);

export default walletRouter;
