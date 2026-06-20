import express from 'express';
import walletController from '../controllers/wallet.controller.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.midlware.js';
import upload from '../config/multer.config.js';

const walletRouter = express.Router();

// All routes require authentication
walletRouter.use(authenticateToken);

// ─── USER ROUTES ────────────────────────────────────────────────────────────
walletRouter.get('/balance',        walletController.getBalance);
walletRouter.get('/transactions',   walletController.getTransactions);
walletRouter.post('/deposit-request', upload.single('screenshot'), walletController.createDepositRequest);

// ─── ADMIN ROUTES ───────────────────────────────────────────────────────────
walletRouter.get('/admin/wallets',        requireAdmin, walletController.getAllWallets);
walletRouter.post('/admin/topup',         requireAdmin, walletController.adminTopup);
walletRouter.get('/admin/pending-deposits', requireAdmin, walletController.getPendingDeposits);
walletRouter.get('/admin/deposits/:status', requireAdmin, walletController.getDepositsByStatus);
walletRouter.post('/admin/deposit/:transactionId/approve', requireAdmin, walletController.approveDeposit);
walletRouter.post('/admin/deposit/:transactionId/reject', requireAdmin, walletController.rejectDeposit);

export default walletRouter;
