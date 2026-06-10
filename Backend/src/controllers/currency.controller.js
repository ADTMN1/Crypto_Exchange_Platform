import currencyService from '../services/currency.service.js';
import AppError from '../utils/errorHandling.js';
import auditController from './audit.controller.js';

const currencyController = {

  // ─── GET ALL CURRENCIES ─────────────────────────────────────────────────────

  getAllCurrencies: async (req, res, next) => {
    try {
      const { includeDisabled } = req.query;
      const currencies = await currencyService.getAllCurrencies(
        includeDisabled === 'true'
      );

      res.status(200).json({
        success: true,
        message: 'Currencies retrieved successfully',
        data: currencies,
      });

      auditController.auditingSave(req, 'Viewed all currencies', 'admin_currency', null)
        .catch((err) => console.error('Audit save failed:', err));
      return;
    } catch (error) {
      next(error);
    }
  },

  // ─── GET SINGLE CURRENCY ────────────────────────────────────────────────────

  getCurrency: async (req, res, next) => {
    try {
      const { id } = req.params;
      const currency = await currencyService.getCurrencyById(id);

      res.status(200).json({
        success: true,
        message: 'Currency retrieved successfully',
        data: currency,
      });

      return;
    } catch (error) {
      next(error);
    }
  },

  // ─── CREATE CURRENCY ────────────────────────────────────────────────────────

  createCurrency: async (req, res, next) => {
    try {
      const currency = await currencyService.createCurrency(req.body);

      res.status(201).json({
        success: true,
        message: 'Currency created successfully',
        data: currency,
      });

      auditController.auditingSave(req, 'Created currency', 'admin_currency', currency.id, { name: currency.name, symbol: currency.symbol })
        .catch((err) => console.error('Audit save failed:', err));
      return;
    } catch (error) {
      next(error);
    }
  },

  // ─── UPDATE CURRENCY ────────────────────────────────────────────────────────

  updateCurrency: async (req, res, next) => {
    try {
      const { id } = req.params;
      const currency = await currencyService.updateCurrency(id, req.body);

      res.status(200).json({
        success: true,
        message: 'Currency updated successfully',
        data: currency,
      });

      auditController.auditingSave(req, 'Updated currency', 'admin_currency', currency.id, req.body)
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
      const { status } = req.body;

      if (!status) {
        return next(new AppError('Status is required', 400));
      }

      const currency = await currencyService.updateStatus(id, status);

      res.status(200).json({
        success: true,
        message: `Currency ${status === 'enabled' ? 'enabled' : 'disabled'} successfully`,
        data: currency,
      });

      auditController.auditingSave(req, `${status === 'enabled' ? 'Enabled' : 'Disabled'} currency`, 'admin_currency', currency.id)
        .catch((err) => console.error('Audit save failed:', err));
      return;
    } catch (error) {
      next(error);
    }
  },

  // ─── DELETE CURRENCY ────────────────────────────────────────────────────────

  deleteCurrency: async (req, res, next) => {
    try {
      const { id } = req.params;
      const currency = await currencyService.deleteCurrency(id);

      res.status(200).json({
        success: true,
        message: 'Currency deleted successfully',
        data: currency,
      });

      auditController.auditingSave(req, 'Deleted currency', 'admin_currency', currency.id)
        .catch((err) => console.error('Audit save failed:', err));
      return;
    } catch (error) {
      next(error);
    }
  },

  // ─── BULK IMPORT ────────────────────────────────────────────────────────────

  bulkImport: async (req, res, next) => {
    try {
      const { symbols } = req.body;

      if (!symbols) {
        return next(new AppError('Symbols array is required', 400));
      }

      const result = await currencyService.bulkImport(symbols);

      res.status(200).json({
        success: true,
        message: `Import completed: ${result.imported} imported, ${result.skipped} skipped, ${result.errors} errors`,
        data: result,
      });

      auditController.auditingSave(req, 'Bulk imported currencies', 'admin_currency', null, { count: result.imported })
        .catch((err) => console.error('Audit save failed:', err));
      return;
    } catch (error) {
      next(error);
    }
  },

  // ─── GET SUPPORTED SYMBOLS ──────────────────────────────────────────────────

  getSupportedSymbols: async (req, res, next) => {
    try {
      const symbols = currencyService.getSupportedSymbols();

      res.status(200).json({
        success: true,
        message: 'Supported symbols retrieved successfully',
        data: symbols,
      });

      return;
    } catch (error) {
      next(error);
    }
  },
};

export default currencyController;
