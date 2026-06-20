import pairService from '../services/pair.service.js';
import AppError from '../utils/errorHandling.js';
import auditController from './audit.controller.js';

const pairController = {

  // ─── GET ALL PAIRS (ADMIN) ──────────────────────────────────────────────────

  getAllPairs: async (req, res, next) => {
    try {
      const { includeInactive } = req.query;
      const pairs = await pairService.getAllPairs(
        includeInactive === 'true'
      );

      res.status(200).json({
        success: true,
        message: 'Trading pairs retrieved successfully',
        data: pairs,
      });

      auditController.auditingSave(req, 'Viewed all trading pairs', 'admin_trading_pairs', null)
        .catch((err) => console.error('Audit save failed:', err));
      return;
    } catch (error) {
      next(error);
    }
  },

  // ─── GET SINGLE PAIR ────────────────────────────────────────────────────────

  getPair: async (req, res, next) => {
    try {
      const { id } = req.params;
      const pair = await pairService.getPairById(id);

      res.status(200).json({
        success: true,
        message: 'Trading pair retrieved successfully',
        data: pair,
      });

      return;
    } catch (error) {
      next(error);
    }
  },

  // ─── CREATE PAIR ────────────────────────────────────────────────────────────

  createPair: async (req, res, next) => {
    try {
      const pair = await pairService.createPair(req.body);

      res.status(201).json({
        success: true,
        message: 'Trading pair created successfully',
        data: pair,
      });

      auditController.auditingSave(
        req, 
        'Created trading pair', 
        'admin_trading_pairs', 
        pair.id, 
        { base: pair.base_currency, quote: pair.quote_currency }
      ).catch((err) => console.error('Audit save failed:', err));
      return;
    } catch (error) {
      next(error);
    }
  },

  // ─── UPDATE PAIR ────────────────────────────────────────────────────────────

  updatePair: async (req, res, next) => {
    try {
      const { id } = req.params;
      const pair = await pairService.updatePair(id, req.body);

      res.status(200).json({
        success: true,
        message: 'Trading pair updated successfully',
        data: pair,
      });

      auditController.auditingSave(req, 'Updated trading pair', 'admin_trading_pairs', pair.id, req.body)
        .catch((err) => console.error('Audit save failed:', err));
      return;
    } catch (error) {
      next(error);
    }
  },

  // ─── UPDATE STATUS ──────────────────────────────────────────────────────────

  updateStatus: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { is_active } = req.body;

      if (is_active === undefined) {
        return next(new AppError('is_active is required', 400));
      }

      const pair = await pairService.updateStatus(id, is_active);

      res.status(200).json({
        success: true,
        message: `Trading pair ${is_active ? 'enabled' : 'disabled'} successfully`,
        data: pair,
      });

      auditController.auditingSave(
        req, 
        `${is_active ? 'Enabled' : 'Disabled'} trading pair`, 
        'admin_trading_pairs', 
        pair.id
      ).catch((err) => console.error('Audit save failed:', err));
      return;
    } catch (error) {
      next(error);
    }
  },

  // ─── DELETE PAIR ────────────────────────────────────────────────────────────

  deletePair: async (req, res, next) => {
    try {
      const { id } = req.params;
      const pair = await pairService.deletePair(id);

      res.status(200).json({
        success: true,
        message: 'Trading pair deleted successfully',
        data: pair,
      });

      auditController.auditingSave(req, 'Deleted trading pair', 'admin_trading_pairs', pair.id)
        .catch((err) => console.error('Audit save failed:', err));
      return;
    } catch (error) {
      next(error);
    }
  },

  // ─── GET ENABLED PAIRS (USER ENDPOINT) ──────────────────────────────────────

  getEnabledPairs: async (req, res, next) => {
    try {
      const pairs = await pairService.getEnabledPairs();

      res.status(200).json({
        success: true,
        message: 'Active trading pairs retrieved successfully',
        data: pairs,
      });

      return;
    } catch (error) {
      next(error);
    }
  },
};

export default pairController;
