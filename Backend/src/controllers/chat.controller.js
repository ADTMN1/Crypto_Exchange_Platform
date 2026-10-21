import ChatService from '../services/chat.service.js';
import AppError from '../utils/errorHandling.js';

const ChatController = {
  // ----------------------------------------------------------------
  // USER — GET /api/support/conversation
  // Returns (or auto-creates) the user's single conversation
  // ----------------------------------------------------------------
  getConversation: async (req, res, next) => {
    try {
      const conversation = await ChatService.getOrCreateConversation(req.user.id);
      res.status(200).json({ success: true, data: conversation });
    } catch (err) {
      next(err);
    }
  },

  // ----------------------------------------------------------------
  // USER — GET /api/support/messages
  // Returns all messages for the caller's conversation
  // ----------------------------------------------------------------
  getMessages: async (req, res, next) => {
    try {
      const conversation = await ChatService.getOrCreateConversation(req.user.id);

      // Mark admin messages as read when user fetches
      await ChatService.markMessagesRead(conversation.id, 'user');

      const messages = await ChatService.getMessages(conversation.id);
      res.status(200).json({ success: true, data: messages });
    } catch (err) {
      next(err);
    }
  },

  // ----------------------------------------------------------------
  // USER — POST /api/support/messages  { message: "..." }
  // ----------------------------------------------------------------
  sendMessage: async (req, res, next) => {
    try {
      const { message } = req.body;
      if (!message || !message.trim()) {
        return next(new AppError('Message is required', 400));
      }

      const conversation = await ChatService.getOrCreateConversation(req.user.id);

      const saved = await ChatService.sendMessage({
        conversationId: conversation.id,
        senderId:       req.user.id,
        senderType:     'user',
        message,
      });

      res.status(201).json({ success: true, data: saved });
    } catch (err) {
      next(err);
    }
  },

  // ----------------------------------------------------------------
  // USER — GET /api/support/unread-count
  // ----------------------------------------------------------------
  getUserUnreadCount: async (req, res, next) => {
    try {
      const count = await ChatService.getUserUnreadCount(req.user.id);
      res.status(200).json({ success: true, data: { count } });
    } catch (err) {
      next(err);
    }
  },

  // ----------------------------------------------------------------
  // ADMIN — GET /api/support/admin/conversations
  // ----------------------------------------------------------------
  getAllConversations: async (req, res, next) => {
    try {
      const { limit = 50, offset = 0, status } = req.query;
      const result = await ChatService.getAllConversations({
        limit: parseInt(limit),
        offset: parseInt(offset),
        status,
      });
      res.status(200).json({
        success: true,
        data:       result.conversations,
        total:      result.total,
        pagination: { limit: parseInt(limit), offset: parseInt(offset) },
      });
    } catch (err) {
      next(err);
    }
  },

  // ----------------------------------------------------------------
  // ADMIN — GET /api/support/admin/conversations/:conversationId/messages
  // ----------------------------------------------------------------
  getConversationMessages: async (req, res, next) => {
    try {
      const { conversationId } = req.params;

      // Mark user messages as read when admin opens conversation
      await ChatService.markMessagesRead(conversationId, 'admin');

      const messages = await ChatService.getMessages(conversationId);
      res.status(200).json({ success: true, data: messages });
    } catch (err) {
      next(err);
    }
  },

  // ----------------------------------------------------------------
  // ADMIN — POST /api/support/admin/conversations/:conversationId/messages
  // ----------------------------------------------------------------
  adminSendMessage: async (req, res, next) => {
    try {
      const { conversationId } = req.params;
      const { message } = req.body;

      if (!message || !message.trim()) {
        return next(new AppError('Message is required', 400));
      }

      const saved = await ChatService.sendMessage({
        conversationId,
        senderId:   req.user.id,
        senderType: 'admin',
        message,
      });

      res.status(201).json({ success: true, data: saved });
    } catch (err) {
      next(err);
    }
  },

  // ----------------------------------------------------------------
  // ADMIN — POST /api/support/admin/conversations/:conversationId/close
  // ----------------------------------------------------------------
  closeConversation: async (req, res, next) => {
    try {
      const conv = await ChatService.closeConversation(req.params.conversationId);
      res.status(200).json({ success: true, data: conv });
    } catch (err) {
      next(err);
    }
  },

  // ----------------------------------------------------------------
  // ADMIN — POST /api/support/admin/conversations/:conversationId/reopen
  // ----------------------------------------------------------------
  reopenConversation: async (req, res, next) => {
    try {
      const conv = await ChatService.reopenConversation(req.params.conversationId);
      res.status(200).json({ success: true, data: conv });
    } catch (err) {
      next(err);
    }
  },

  // ----------------------------------------------------------------
  // ADMIN — GET /api/support/admin/unread-count
  // ----------------------------------------------------------------
  getAdminUnreadCount: async (req, res, next) => {
    try {
      const count = await ChatService.getAdminUnreadCount();
      res.status(200).json({ success: true, data: { count } });
    } catch (err) {
      next(err);
    }
  },
};

export default ChatController;
