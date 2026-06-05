import express from 'express';
import auditController from '../controllers/audit.controller.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.midlware.js';

const auditRouter = express.Router();

auditRouter.use(authenticateToken);
// Admins only: allow pagination and viewing all audit logs
auditRouter.get('/audit-logs', requireAdmin, auditController.auditingFetch);

export default auditRouter;