import walletService from '../services/wallet.service.js';
import AppError from '../utils/errorHandling.js';
import auditController from './audit.controller.js';
import notificationService from '../services/notification.service.js';
import { emitToUser } from '../websocket/socket.js';

const walletController = {

  // ─── USER ENDPOINTS ─────────────────────────────────────────────────────────

  getBalance: async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return next(new AppError('Authenticated user information is missing', 401));
      }

      const wallets = await walletService.getBalance(req.user.id);
      res.status(200).json({ 
        success: true, 
        message: 'Wallet balances retrieved successfully',
        data: wallets 
      });

      auditController.auditingSave(req, 'Viewed wallet balance', 'wallet', req.user.id)
        .catch((err) => console.error('Audit save failed:', err));
      return;
    } catch (error) {
      next(error);
    }
  },

  getTransactions: async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return next(new AppError('Authenticated user information is missing', 401));
      }

      const { page } = req.query;
      const result = await walletService.getTransactions(
        req.user.id,
        parseInt(page) || 1,
        20
      );

      res.status(200).json({ 
        success: true, 
        message: 'Transaction history retrieved successfully',
        data: result 
      });

      auditController.auditingSave(req, 'Viewed transaction history', 'wallet', req.user.id)
        .catch((err) => console.error('Audit save failed:', err));
      return;
    } catch (error) {
      next(error);
    }
  },

  createDepositRequest: async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return next(new AppError('Authenticated user information is missing', 401));
      }

      const { currency, amount } = req.body;
      const screenshotFile = req.file;

      if (!currency || !amount) {
        return next(new AppError('Currency and amount are required', 400));
      }

      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return next(new AppError('Amount must be a positive number', 400));
      }

      const transaction = await walletService.createDepositRequest(
        req.user.id,
        currency,
        parsedAmount,
        screenshotFile
      );

      res.status(201).json({
        success: true,
        message: 'Deposit request created successfully',
        data: transaction
      });

      auditController.auditingSave(req, 'Created deposit request', 'wallet', req.user.id, { currency, amount })
        .catch((err) => console.error('Audit save failed:', err));

      notificationService.sendAdminAlert({
        type: 'DEPOSIT_REQUESTED',
        title: 'New Deposit Request',
        body: `User ${req.user.email} submitted a deposit request for ${amount} ${currency}.`,
        metadata: { userId: req.user.id, currency, amount, transactionId: transaction.id },
      }).catch((err) => console.error('Admin alert (deposit request) failed:', err));
      return;
    } catch (error) {
      next(error);
    }
  },



  // ─── ADMIN ENDPOINTS ────────────────────────────────────────────────────────

  getAllWallets: async (req, res, next) => {
    try {
      const { page, limit } = req.query;
      const result = await walletService.getAllWallets(
        parseInt(page) || 1,
        parseInt(limit) || 50
      );

      res.status(200).json({ 
        success: true, 
        message: 'All wallets retrieved successfully',
        data: result 
      });

      auditController.auditingSave(req, 'Viewed all wallets', 'admin_wallet', null)
        .catch((err) => console.error('Audit save failed:', err));
      return;
    } catch (error) {
      next(error);
    }
  },

  adminTopup: async (req, res, next) => {
    try {
      const { userId, currency, amount } = req.body;

      if (!userId || !currency || !amount) {
        return next(new AppError('userId, currency, and amount are required', 400));
      }

      if (amount <= 0) {
        return next(new AppError('Amount must be positive', 400));
      }

      await walletService.adminTopup(userId, currency, parseFloat(amount));

      res.status(200).json({ 
        success: true, 
        message: `Successfully topped up ${amount} ${currency} to user wallet` 
      });

      auditController.auditingSave(req, 'Admin wallet topup', 'admin_wallet', userId, { currency, amount })
        .catch((err) => console.error('Audit save failed:', err));
      return;
    } catch (error) {
      next(error);
    }
  },

  getPendingDeposits: async (req, res, next) => {
    try {
      const { page, limit } = req.query;
      const result = await walletService.getPendingDeposits(
        parseInt(page) || 1,
        parseInt(limit) || 50
      );

      res.status(200).json({
        success: true,
        message: 'Pending deposits retrieved successfully',
        data: result
      });

      auditController.auditingSave(req, 'Viewed pending deposits', 'admin_wallet', null)
        .catch((err) => console.error('Audit save failed:', err));
      return;
    } catch (error) {
      next(error);
    }
  },

  getDepositsByStatus: async (req, res, next) => {
    try {
      const { status } = req.params;
      const { page, limit } = req.query;
      
      const result = await walletService.getDepositsByStatus(
        status,
        parseInt(page) || 1,
        parseInt(limit) || 50
      );

      res.status(200).json({
        success: true,
        message: 'Deposits retrieved successfully',
        data: result
      });

      auditController.auditingSave(req, `Viewed ${status} deposits`, 'admin_wallet', null)
        .catch((err) => console.error('Audit save failed:', err));
      return;
    } catch (error) {
      next(error);
    }
  },

  approveDeposit: async (req, res, next) => {
    try {
      const { transactionId } = req.params;
      if (!transactionId) {
        return next(new AppError('Transaction ID is required', 400));
      }

      const result = await walletService.approveDeposit(transactionId, req.user.id);

      emitToUser(result.userId, 'wallet:updated', {
        reason: 'deposit_approved',
        wallet: result.wallet,
        transaction: result.transaction
      });

      res.status(200).json({
        success: true,
        message: 'Deposit approved successfully',
        data: result
      });

      auditController.auditingSave(req, 'Approved deposit', 'admin_wallet', null, { transactionId })
        .catch((err) => console.error('Audit save failed:', err));

      notificationService.sendAdminAlert({
        type: 'DEPOSIT_APPROVED',
        title: 'Deposit Approved',
        body: `Deposit ${transactionId} was approved by admin ${req.user.email}.`,
        metadata: { transactionId, adminId: req.user.id },
      }).catch((err) => console.error('Admin alert (deposit approved) failed:', err));
      return;
    } catch (error) {
      next(error);
    }
  },

  rejectDeposit: async (req, res, next) => {
    try {
      const { transactionId } = req.params;
      if (!transactionId) {
        return next(new AppError('Transaction ID is required', 400));
      }

      await walletService.rejectDeposit(transactionId, req.user.id);

      res.status(200).json({
        success: true,
        message: 'Deposit rejected'
      });

      auditController.auditingSave(req, 'Rejected deposit', 'admin_wallet', null, { transactionId })
        .catch((err) => console.error('Audit save failed:', err));

      notificationService.sendAdminAlert({
        type: 'DEPOSIT_REJECTED',
        title: 'Deposit Rejected',
        body: `Deposit ${transactionId} was rejected by admin ${req.user.email}.`,
        metadata: { transactionId, adminId: req.user.id },
      }).catch((err) => console.error('Admin alert (deposit rejected) failed:', err));
      return;
    } catch (error) {
      next(error);
    }
  },


};

export default walletController;
