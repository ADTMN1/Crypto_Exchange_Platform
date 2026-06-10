import express from 'express';
import currencyController from '../controllers/currency.controller.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.midlware.js';

const currencyRouter = express.Router();

// All routes require authentication and admin role
currencyRouter.use(authenticateToken);
currencyRouter.use(requireAdmin);

// ─── CURRENCY ROUTES ────────────────────────────────────────────────────────
currencyRouter.get('/currencies',                currencyController.getAllCurrencies);
currencyRouter.get('/currencies/supported',      currencyController.getSupportedSymbols);
currencyRouter.get('/currencies/:id',            currencyController.getCurrency);
currencyRouter.post('/currencies',               currencyController.createCurrency);
currencyRouter.put('/currencies/:id',            currencyController.updateCurrency);
currencyRouter.patch('/currencies/:id/status',   currencyController.updateStatus);
currencyRouter.delete('/currencies/:id',         currencyController.deleteCurrency);
currencyRouter.post('/currencies/import',        currencyController.bulkImport);

export default currencyRouter;
