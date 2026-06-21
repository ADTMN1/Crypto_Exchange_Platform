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
notificationRouter.get('/user',                notificationController.getUserNotifications);
notificationRouter.get('/admin',               requireAdmin, notificationController.getAdminNotifications);
notificationRouter.get('/admin/history',       requireAdmin, notificationController.getNotificationHistory);
notificationRouter.get('/admin/history/:id',   requireAdmin, notificationController.getNotificationDetail);

// ─── MARK AS READ ─────────────────────────────────────────────────────────────
notificationRouter.patch('/read/:id',                  notificationController.markAsRead);

// ─── ADMIN BELL ENDPOINTS ─────────────────────────────────────────────────────
notificationRouter.get('/admin/unread-count',          requireAdmin, notificationController.getAdminUnreadCount);
notificationRouter.patch('/admin/read-all',            requireAdmin, notificationController.markAllAdminNotificationsRead);
notificationRouter.patch('/admin/:id/read',            requireAdmin, notificationController.markAdminNotificationRead);

export default notificationRouter;
