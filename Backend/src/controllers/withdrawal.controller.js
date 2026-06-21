import withdrawalService from '../services/withdrawal.service.js';
import AppError from '../utils/errorHandling.js';
import auditController from './audit.controller.js';
import notificationService from '../services/notification.service.js';

const withdrawalController = {

  // ─── USER: Create Withdrawal ─────────────────────────────────────────────────
  createWithdrawal: async (req, res, next) => {
    try {
      if (!req.user?.id) return next(new AppError('Authentication required', 401));

      const { amount, withdrawalAddress, network, currency, paymentMethod } = req.body;

      if (!amount || !withdrawalAddress) {
        return next(new AppError('Amount and withdrawal address are required', 400));
      }

      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return next(new AppError('Amount must be a positive number', 400));
      }

      const withdrawal = await withdrawalService.createWithdrawal(req.user.id, {
        amount: parsedAmount,
        currency: currency || 'USDT',
        withdrawalAddress,
        network: network || null,
        paymentMethod: paymentMethod || null,
      });

      res.status(201).json({ success: true, message: 'Withdrawal request submitted', data: withdrawal });

      auditController.auditingSave(req, 'Created withdrawal request', 'withdrawal', req.user.id, { amount, currency })
        .catch((err) => console.error('Audit save failed:', err));

      notificationService.sendAdminAlert({
        type: 'WITHDRAWAL_REQUESTED',
        title: 'New Withdrawal Request',
        body: `User ${req.user.email} submitted a withdrawal request for ${amount} ${currency || 'USDT'}.`,
        metadata: { userId: req.user.id, amount, currency, withdrawalId: withdrawal.id },
      }).catch((err) => console.error('Admin alert (withdrawal request) failed:', err));
    } catch (error) {
      next(error);
    }
  },

  // ─── USER: Get My Withdrawals ────────────────────────────────────────────────
  getMyWithdrawals: async (req, res, next) => {
    try {
      if (!req.user?.id) return next(new AppError('Authentication required', 401));

      const { status, page, limit } = req.query;
      const result = await withdrawalService.getUserWithdrawals(
        req.user.id,
        status || 'ALL',
        parseInt(page) || 1,
        parseInt(limit) || 20
      );

      res.status(200).json({ success: true, message: 'Withdrawals retrieved', data: result });
    } catch (error) {
      next(error);
    }
  },

  // ─── ADMIN: Get All Withdrawals ──────────────────────────────────────────────
  getAllWithdrawals: async (req, res, next) => {
    try {
      const { status, page, limit } = req.query;
      const result = await withdrawalService.getAllWithdrawals(
        status || 'ALL',
        parseInt(page) || 1,
        parseInt(limit) || 50
      );

      res.status(200).json({ success: true, message: 'Withdrawals retrieved', data: result });

      auditController.auditingSave(req, 'Viewed all withdrawals', 'admin_withdrawal', null)
        .catch((err) => console.error('Audit save failed:', err));
    } catch (error) {
      next(error);
    }
  },

  // ─── ADMIN: Get Single Withdrawal ───────────────────────────────────────────
  getWithdrawalById: async (req, res, next) => {
    try {
      const { withdrawalId } = req.params;
      const withdrawal = await withdrawalService.getWithdrawalById(withdrawalId);
      res.status(200).json({ success: true, message: 'Withdrawal retrieved', data: withdrawal });
    } catch (error) {
      next(error);
    }
  },

  // ─── ADMIN: Change Withdrawal Status ────────────────────────────────────────
  changeWithdrawStatus: async (req, res, next) => {
    try {
      if (!req.user?.id) return next(new AppError('Authentication required', 401));

      const { withdrawalId } = req.params;
      const { status, adminNote, rejectionReason } = req.body;

      if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
        return next(new AppError('Status must be APPROVED or REJECTED', 400));
      }

      let result;
      if (status === 'APPROVED') {
        result = await withdrawalService.approveWithdrawal(withdrawalId, req.user.id, adminNote);
      } else {
        result = await withdrawalService.rejectWithdrawal(withdrawalId, req.user.id, adminNote, rejectionReason);
      }

      res.status(200).json({ success: true, message: `Withdrawal ${status.toLowerCase()}`, data: result });

      auditController.auditingSave(req, `${status} withdrawal`, 'admin_withdrawal', null, { withdrawalId, status })
        .catch((err) => console.error('Audit save failed:', err));

      notificationService.sendAdminAlert({
        type: status === 'APPROVED' ? 'WITHDRAWAL_APPROVED' : 'WITHDRAWAL_REJECTED',
        title: `Withdrawal ${status === 'APPROVED' ? 'Approved' : 'Rejected'}`,
        body: `Withdrawal ${withdrawalId} was ${status.toLowerCase()} by admin ${req.user.email}.`,
        metadata: { withdrawalId, status, adminId: req.user.id },
      }).catch((err) => console.error('Admin alert (withdrawal status) failed:', err));
    } catch (error) {
      next(error);
    }
  },

  // ─── ADMIN: Update Wallet Balance ───────────────────────────────────────────
  updateWallet: async (req, res, next) => {
    try {
      if (!req.user?.id) return next(new AppError('Authentication required', 401));

      const { walletId } = req.params;
      const { operation, amount, reason } = req.body;

      if (!operation || !amount) {
        return next(new AppError('Operation and amount are required', 400));
      }

      const result = await withdrawalService.adminUpdateWallet(walletId, operation, parseFloat(amount), reason, req.user.id);
      res.status(200).json({ success: true, message: 'Wallet updated', data: result });

      auditController.auditingSave(req, `Admin ${operation} wallet`, 'admin_wallet', null, { walletId, amount, operation })
        .catch((err) => console.error('Audit save failed:', err));
    } catch (error) {
      next(error);
    }
  },
};

export default withdrawalController;
