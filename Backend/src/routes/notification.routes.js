import express from 'express';
import notificationController from '../controllers/notification.controller.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.midlware.js';

const notificationRouter = express.Router();

notificationRouter.use(authenticateToken);

// ─── SEND (Admin only) ────────────────────────────────────────────────────────
notificationRouter.post('/send',            requireAdmin, notificationController.sendToUser);
notificationRouter.post('/send/all',        requireAdmin, notificationController.sendToAll);
notificationRouter.post('/send/by-status',  requireAdmin, notificationController.sendByStatus);

// ─── READ ─────────────────────────────────────────────────────────────────────
notificationRouter.get('/user',             notificationController.getUserNotifications);
notificationRouter.get('/admin',            requireAdmin, notificationController.getAdminNotifications);

// ─── MARK AS READ ─────────────────────────────────────────────────────────────
notificationRouter.patch('/read/:id',       notificationController.markAsRead);

export default notificationRouter;
