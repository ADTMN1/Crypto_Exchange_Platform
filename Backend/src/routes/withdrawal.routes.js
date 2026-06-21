import express from 'express';
import withdrawalController from '../controllers/withdrawal.controller.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.midlware.js';

const withdrawalRouter = express.Router();

withdrawalRouter.use(authenticateToken);

// ─── USER ROUTES ─────────────────────────────────────────────────────────────
withdrawalRouter.post('/',    withdrawalController.createWithdrawal);
withdrawalRouter.get('/me',   withdrawalController.getMyWithdrawals);

// ─── ADMIN ROUTES ─────────────────────────────────────────────────────────────
withdrawalRouter.get('/admin/all',                          requireAdmin, withdrawalController.getAllWithdrawals);
withdrawalRouter.get('/admin/:withdrawalId',                requireAdmin, withdrawalController.getWithdrawalById);
withdrawalRouter.patch('/admin/change-status/:withdrawalId', requireAdmin, withdrawalController.changeWithdrawStatus);
withdrawalRouter.patch('/admin/update-wallet/:walletId',    requireAdmin, withdrawalController.updateWallet);

export default withdrawalRouter;
