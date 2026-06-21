import notificationService from '../services/notification.service.js';
import AppError from '../utils/errorHandling.js';

const notificationController = {

  // ─── POST /notifications/send ────────────────────────────────────────────────

  sendToUser: async (req, res, next) => {
    try {
      const { userId, type, title, body, metadata } = req.body;

      if (!userId || !type || !title || !body) {
        return next(new AppError('userId, type, title, and body are required.', 400));
      }

      const data = await notificationService.sendToUser({ userId, type, title, body, metadata });

      return res.status(201).json({
        success: true,
        message: 'Notification sent successfully.',
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  // ─── POST /notifications/send/all ───────────────────────────────────────────

  sendToAll: async (req, res, next) => {
    try {
      const { type, title, body, metadata } = req.body;

      if (!type || !title || !body) {
        return next(new AppError('type, title, and body are required.', 400));
      }

      const data = await notificationService.sendToAllUsers({ type, title, body, metadata });

      return res.status(201).json({
        success: true,
        message: `Notification sent to ${data.recipientCount} users.`,
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  // ─── POST /notifications/send/by-status ─────────────────────────────────────

  sendByStatus: async (req, res, next) => {
    try {
      const { status, type, title, body, metadata } = req.body;

      if (!status || !type || !title || !body) {
        return next(new AppError('status, type, title, and body are required.', 400));
      }

      const data = await notificationService.sendByStatus({ status, type, title, body, metadata });

      return res.status(201).json({
        success: true,
        message: `Notification sent to ${data.recipientCount} users with status '${status}'.`,
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  // ─── GET /notifications/user ─────────────────────────────────────────────────

  getUserNotifications: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const page   = parseInt(req.query.page)  || 1;
      const limit  = parseInt(req.query.limit) || 20;

      const data = await notificationService.getUserNotifications(userId, { page, limit });

      return res.status(200).json({
        success: true,
        message: 'User notifications fetched successfully.',
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  // ─── GET /notifications/admin/history ───────────────────────────────────────

  getNotificationHistory: async (req, res, next) => {
    try {
      const page   = Math.max(1, parseInt(req.query.page)  || 1);
      const limit  = Math.min(100, parseInt(req.query.limit) || 20);
      const search = req.query.search?.trim() || null;
      const type   = req.query.type?.trim()   || null;
      const userId = req.query.userId?.trim() || null;

      const { records, totalCount } = await notificationService.getNotificationHistory({
        page, limit, search, type, userId,
      });

      return res.status(200).json({
        success: true,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(totalCount / limit)),
        totalCount,
        data: records,
      });
    } catch (error) {
      next(error);
    }
  },

  // ─── GET /notifications/admin/history/:id ───────────────────────────────────

  getNotificationDetail: async (req, res, next) => {
    try {
      const { id } = req.params;
      const data = await notificationService.getNotificationDetail(id);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  // ─── GET /notifications/admin ────────────────────────────────────────────────

  getAdminNotifications: async (req, res, next) => {
    try {
      const page  = parseInt(req.query.page)  || 1;
      const limit = parseInt(req.query.limit) || 20;

      const data = await notificationService.getAdminNotifications({ page, limit });

      return res.status(200).json({
        success: true,
        message: 'Admin notifications fetched successfully.',
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  // ─── GET /notifications/admin/unread-count ───────────────────────────────────

  getAdminUnreadCount: async (req, res, next) => {
    try {
      const count = await notificationService.getAdminUnreadCount(req.user.id);
      return res.status(200).json({ success: true, data: { unread_count: count } });
    } catch (error) {
      next(error);
    }
  },

  // ─── PATCH /notifications/admin/:id/read ─────────────────────────────────────

  markAdminNotificationRead: async (req, res, next) => {
    try {
      const { id } = req.params;
      const data = await notificationService.markAdminNotificationRead(id, req.user.id);
      return res.status(200).json({ success: true, message: 'Marked as read.', data });
    } catch (error) {
      next(error);
    }
  },

  // ─── PATCH /notifications/admin/read-all ─────────────────────────────────────

  markAllAdminNotificationsRead: async (req, res, next) => {
    try {
      await notificationService.markAllAdminNotificationsRead(req.user.id);
      return res.status(200).json({ success: true, message: 'All marked as read.' });
    } catch (error) {
      next(error);
    }
  },

  // ─── PATCH /notifications/read/:id ──────────────────────────────────────────

  markAsRead: async (req, res, next) => {
    try {
      const notificationId = req.params.id;
      const userId         = req.user.id;

      if (!notificationId) {
        return next(new AppError('Notification ID is required.', 400));
      }

      const data = await notificationService.markAsRead(notificationId, userId);

      return res.status(200).json({
        success: true,
        message: 'Notification marked as read.',
        data,
      });
    } catch (error) {
      next(error);
    }
  },
};

export default notificationController;
