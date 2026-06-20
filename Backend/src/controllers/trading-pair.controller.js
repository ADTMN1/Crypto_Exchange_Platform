import tradingPairService from '../services/trading-pair.service.js';
import AppError from '../utils/errorHandling.js';
import auditController from './audit.controller.js';

const tradingPairController = {
  // ─── GET ALL TRADING PAIRS ──────────────────────────────────────────────────
  getAllPairs: async (req, res, next) => {
    try {
      const { includeInactive } = req.query;
      const pairs = await tradingPairService.getAllPairs(includeInactive === 'true');
      res.status(200).json({
        success: true,
        message: 'Trading pairs retrieved successfully',
        data: pairs,
      });
    } catch (error) {
      next(error);
    }
  },

  // ─── GET TRADING PAIR BY ID ─────────────────────────────────────────────────
  getPairById: async (req, res, next) => {
    try {
      const { id } = req.params;
      const pair = await tradingPairService.getPairById(id);
      res.status(200).json({
        success: true,
        message: 'Trading pair retrieved successfully',
        data: pair,
      });
    } catch (error) {
      next(error);
    }
  },

  // ─── CREATE TRADING PAIR (ADMIN) ────────────────────────────────────────────
  createPair: async (req, res, next) => {
    try {
      const pair = await tradingPairService.createPair(req.body);
      res.status(201).json({
        success: true,
        message: 'Trading pair created successfully',
        data: pair,
      });

      auditController.auditingSave(req, 'Created trading pair', 'trading_pair', pair.id, req.body)
        .catch((err) => console.error('Audit save failed:', err));
      return;
    } catch (error) {
      next(error);
    }
  },

  // ─── UPDATE TRADING PAIR (ADMIN) ────────────────────────────────────────────
  updatePair: async (req, res, next) => {
    try {
      const { id } = req.params;
      const pair = await tradingPairService.updatePair(id, req.body);
      res.status(200).json({
        success: true,
        message: 'Trading pair updated successfully',
        data: pair,
      });

      auditController.auditingSave(req, 'Updated trading pair', 'trading_pair', id, req.body)
        .catch((err) => console.error('Audit save failed:', err));
      return;
    } catch (error) {
      next(error);
    }
  },

  // ─── DELETE TRADING PAIR (ADMIN) ────────────────────────────────────────────
  deletePair: async (req, res, next) => {
    try {
      const { id } = req.params;
      const pair = await tradingPairService.deletePair(id);
      res.status(200).json({
        success: true,
        message: 'Trading pair deleted successfully',
        data: pair,
      });

      auditController.auditingSave(req, 'Deleted trading pair', 'trading_pair', id)
        .catch((err) => console.error('Audit save failed:', err));
      return;
    } catch (error) {
      next(error);
    }
  },
};

export default tradingPairController;
