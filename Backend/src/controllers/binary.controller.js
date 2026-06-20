import binaryService from '../services/binary.service.js';
import AppError from '../utils/errorHandling.js';
import auditController from './audit.controller.js';

const binaryController = {

  // ─── USER ENDPOINTS ─────────────────────────────────────────────────────────

  placeTrade: async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return next(new AppError('Authenticated user information is missing', 401));
      }

      const { pair, direction, amount, duration } = req.body;

      if (!pair || !direction || !amount || !duration) {
        return next(new AppError('pair, direction, amount, and duration are required', 400));
      }

      const trade = await binaryService.placeTrade(
        req.user.id,
        pair,
        direction.toUpperCase(),
        parseFloat(amount),
        parseInt(duration)
      );

      res.status(201).json({
        success: true,
        message: 'Binary trade placed successfully',
        data: trade,
      });

      auditController.auditingSave(req, 'Placed binary trade', 'binary_trade', trade.id, { pair, direction, amount, duration })
        .catch((err) => console.error('Audit save failed:', err));
      return;
    } catch (error) {
      next(error);
    }
  },

  getMyTrades: async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return next(new AppError('Authenticated user information is missing', 401));
      }

      const { status, page } = req.query;
      const result = await binaryService.getMyTrades(
        req.user.id,
        status,
        parseInt(page) || 1,
        20
      );

      res.status(200).json({
        success: true,
        message: 'Trades retrieved successfully',
        data: result,
      });

      auditController.auditingSave(req, 'Viewed binary trades', 'binary_trade', req.user.id)
        .catch((err) => console.error('Audit save failed:', err));
      return;
    } catch (error) {
      next(error);
    }
  },

  getSettings: async (req, res, next) => {
    try {
      const settings = await binaryService.getSettings();
      res.status(200).json({
        success: true,
        message: 'Binary settings retrieved successfully',
        data: settings,
      });
    } catch (error) {
      next(error);
    }
  },

  // ─── ADMIN ENDPOINTS ────────────────────────────────────────────────────────

  getAdminTrades: async (req, res, next) => {
    try {
      const { status } = req.params;
      const { page } = req.query;

      const result = await binaryService.getAdminTrades(
        status,
        parseInt(page) || 1,
        20
      );

      res.status(200).json({
        success: true,
        message: 'Admin trades retrieved successfully',
        data: result,
      });

      auditController.auditingSave(req, 'Viewed admin binary trades', 'admin_binary', null, { status })
        .catch((err) => console.error('Audit save failed:', err));
      return;
    } catch (error) {
      next(error);
    }
  },

  updateSettings: async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return next(new AppError('Authenticated user information is missing', 401));
      }

      const settings = req.body;
      const updatedSettings = await binaryService.updateSettings(settings, req.user.id);

      res.status(200).json({
        success: true,
        message: 'Binary settings updated successfully',
        data: updatedSettings,
      });

      auditController.auditingSave(req, 'Updated binary settings', 'binary_settings', null, settings)
        .catch((err) => console.error('Audit save failed:', err));
      return;
    } catch (error) {
      next(error);
    }
  },
};

export default binaryController;
