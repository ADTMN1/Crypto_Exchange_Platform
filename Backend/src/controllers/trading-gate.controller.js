import tradingGateService from '../services/trading-gate.service.js';
import AppError from '../utils/errorHandling.js';
import auditController from './audit.controller.js';

const tradingGateController = {

  // ─── PUBLIC ENDPOINTS ───────────────────────────────────────────────────────

  /**
   * Get current trading gate status
   * Public endpoint - no authentication required
   */
  getStatus: async (req, res, next) => {
    try {
      const status = await tradingGateService.getCurrentStatus();
      
      res.status(200).json({
        success: true,
        message: 'Trading gate status retrieved successfully',
        data: {
          status: status.status,
          isOpen: status.status === 'open',
          lastChanged: status.changed_at
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // ─── ADMIN ENDPOINTS ────────────────────────────────────────────────────────

  /**
   * Open the trading gate
   * Requires admin authentication
   */
  openGate: async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return next(new AppError('Authenticated user information is missing', 401));
      }

      const changedBy = req.user.username || req.user.email || `User-${req.user.id}`;
      const gateInfo = await tradingGateService.openGate(changedBy);

      res.status(200).json({
        success: true,
        message: 'Trading gate opened successfully',
        data: {
          id: gateInfo.id,
          status: gateInfo.status,
          changedBy: gateInfo.changed_by,
          changedAt: gateInfo.changed_at,
          isOpen: true
        }
      });

      // Audit log
      auditController.auditingSave(req, 'Opened trading gate', 'trading_gate', gateInfo.id)
        .catch((err) => console.error('Audit save failed:', err));

    } catch (error) {
      next(error);
    }
  },

  /**
   * Close the trading gate
   * Requires admin authentication
   */
  closeGate: async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return next(new AppError('Authenticated user information is missing', 401));
      }

      const changedBy = req.user.username || req.user.email || `User-${req.user.id}`;
      const gateInfo = await tradingGateService.closeGate(changedBy);

      res.status(200).json({
        success: true,
        message: 'Trading gate closed successfully',
        data: {
          id: gateInfo.id,
          status: gateInfo.status,
          changedBy: gateInfo.changed_by,
          changedAt: gateInfo.changed_at,
          isOpen: false
        }
      });

      // Audit log
      auditController.auditingSave(req, 'Closed trading gate', 'trading_gate', gateInfo.id)
        .catch((err) => console.error('Audit save failed:', err));

    } catch (error) {
      next(error);
    }
  },

  /**
   * Get detailed gate information
   * Requires admin authentication
   */
  getGateDetails: async (req, res, next) => {
    try {
      const gateInfo = await tradingGateService.getGateDetails();

      res.status(200).json({
        success: true,
        message: 'Trading gate details retrieved successfully',
        data: {
          id: gateInfo.id,
          status: gateInfo.status,
          isOpen: gateInfo.status === 'open',
          changedBy: gateInfo.changed_by,
          changedAt: gateInfo.changed_at,
          createdAt: gateInfo.created_at || gateInfo.changed_at
        }
      });

    } catch (error) {
      next(error);
    }
  }

};

export default tradingGateController;