import p2pService from '../services/p2p.service.js';
import AppError from '../utils/errorHandling.js';
import auditController from './audit.controller.js';

const p2pController = {

  // ─── OFFER ENDPOINTS ────────────────────────────────────────────────────────

  createOffer: async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return next(new AppError('Authenticated user information is missing', 401));
      }

      const offer = await p2pService.createOffer(req.user.id, req.body);

      res.status(201).json({
        success: true,
        message: 'P2P offer created successfully',
        data: offer,
      });

      auditController.auditingSave(req, 'Created P2P offer', 'p2p_offer', offer.id)
        .catch((err) => console.error('Audit save failed:', err));
      return;
    } catch (error) {
      next(error);
    }
  },

  getOffers: async (req, res, next) => {
    try {
      const { type, pair, page } = req.query;
      const result = await p2pService.getOffers(
        { type, pair },
        parseInt(page) || 1,
        20
      );

      res.status(200).json({
        success: true,
        message: 'P2P offers retrieved successfully',
        data: result,
      });

      return;
    } catch (error) {
      next(error);
    }
  },

  // ─── ORDER ENDPOINTS ────────────────────────────────────────────────────────

  placeOrder: async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return next(new AppError('Authenticated user information is missing', 401));
      }

      const { offerId, cryptoAmount } = req.body;

      if (!offerId || !cryptoAmount) {
        return next(new AppError('offerId and cryptoAmount are required', 400));
      }

      const order = await p2pService.placeOrder(
        req.user.id,
        offerId,
        parseFloat(cryptoAmount)
      );

      res.status(201).json({
        success: true,
        message: 'P2P order placed successfully',
        data: order,
      });

      auditController.auditingSave(req, 'Placed P2P order', 'p2p_order', order.id)
        .catch((err) => console.error('Audit save failed:', err));
      return;
    } catch (error) {
      next(error);
    }
  },

  markAsPaid: async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return next(new AppError('Authenticated user information is missing', 401));
      }

      const { id } = req.params;
      const order = await p2pService.markAsPaid(id, req.user.id);

      res.status(200).json({
        success: true,
        message: 'Order marked as paid successfully',
        data: order,
      });

      auditController.auditingSave(req, 'Marked P2P order as paid', 'p2p_order', id)
        .catch((err) => console.error('Audit save failed:', err));
      return;
    } catch (error) {
      next(error);
    }
  },

  releaseCrypto: async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return next(new AppError('Authenticated user information is missing', 401));
      }

      const { id } = req.params;
      await p2pService.releaseCrypto(id, req.user.id);

      res.status(200).json({
        success: true,
        message: 'Crypto released successfully',
      });

      auditController.auditingSave(req, 'Released crypto for P2P order', 'p2p_order', id)
        .catch((err) => console.error('Audit save failed:', err));
      return;
    } catch (error) {
      next(error);
    }
  },

  cancelOrder: async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return next(new AppError('Authenticated user information is missing', 401));
      }

      const { id } = req.params;
      await p2pService.cancelOrder(id, req.user.id);

      res.status(200).json({
        success: true,
        message: 'Order cancelled successfully',
      });

      auditController.auditingSave(req, 'Cancelled P2P order', 'p2p_order', id)
        .catch((err) => console.error('Audit save failed:', err));
      return;
    } catch (error) {
      next(error);
    }
  },

  raiseDispute: async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return next(new AppError('Authenticated user information is missing', 401));
      }

      const { id } = req.params;
      const order = await p2pService.raiseDispute(id, req.user.id);

      res.status(200).json({
        success: true,
        message: 'Dispute raised successfully',
        data: order,
      });

      auditController.auditingSave(req, 'Raised dispute for P2P order', 'p2p_order', id)
        .catch((err) => console.error('Audit save failed:', err));
      return;
    } catch (error) {
      next(error);
    }
  },

  getMyOrders: async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return next(new AppError('Authenticated user information is missing', 401));
      }

      const { page } = req.query;
      const result = await p2pService.getMyOrders(
        req.user.id,
        parseInt(page) || 1,
        20
      );

      res.status(200).json({
        success: true,
        message: 'Your P2P orders retrieved successfully',
        data: result,
      });

      return;
    } catch (error) {
      next(error);
    }
  },

  // ─── ADMIN ENDPOINTS ────────────────────────────────────────────────────────

  getAllOrders: async (req, res, next) => {
    try {
      const { page } = req.query;
      const result = await p2pService.getAllOrders(
        parseInt(page) || 1,
        20
      );

      res.status(200).json({
        success: true,
        message: 'All P2P orders retrieved successfully',
        data: result,
      });

      auditController.auditingSave(req, 'Viewed all P2P orders', 'admin_p2p', null)
        .catch((err) => console.error('Audit save failed:', err));
      return;
    } catch (error) {
      next(error);
    }
  },

  getDisputes: async (req, res, next) => {
    try {
      const { page } = req.query;
      const result = await p2pService.getDisputes(
        parseInt(page) || 1,
        20
      );

      res.status(200).json({
        success: true,
        message: 'P2P disputes retrieved successfully',
        data: result,
      });

      auditController.auditingSave(req, 'Viewed P2P disputes', 'admin_p2p', null)
        .catch((err) => console.error('Audit save failed:', err));
      return;
    } catch (error) {
      next(error);
    }
  },

  resolveDispute: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { decision, adminNote } = req.body;

      if (!decision) {
        return next(new AppError('decision is required', 400));
      }

      await p2pService.resolveDispute(id, decision, adminNote);

      res.status(200).json({
        success: true,
        message: 'Dispute resolved successfully',
      });

      auditController.auditingSave(req, 'Resolved P2P dispute', 'admin_p2p', id, { decision, adminNote })
        .catch((err) => console.error('Audit save failed:', err));
      return;
    } catch (error) {
      next(error);
    }
  },
};

export default p2pController;
