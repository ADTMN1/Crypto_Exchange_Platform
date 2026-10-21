import { Router } from 'express';
import ChatController from '../controllers/chat.controller.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.midlware.js';

const router = Router();

// ── User routes (any authenticated user) ────────────────────────────
router.get('/conversation',  authenticateToken, ChatController.getConversation);
router.get('/messages',      authenticateToken, ChatController.getMessages);
router.post('/messages',     authenticateToken, ChatController.sendMessage);
router.get('/unread-count',  authenticateToken, ChatController.getUserUnreadCount);

// ── Admin routes ─────────────────────────────────────────────────────
router.get('/admin/conversations',
  authenticateToken, requireAdmin, ChatController.getAllConversations);

router.get('/admin/unread-count',
  authenticateToken, requireAdmin, ChatController.getAdminUnreadCount);

router.get('/admin/conversations/:conversationId/messages',
  authenticateToken, requireAdmin, ChatController.getConversationMessages);

router.post('/admin/conversations/:conversationId/messages',
  authenticateToken, requireAdmin, ChatController.adminSendMessage);

router.post('/admin/conversations/:conversationId/close',
  authenticateToken, requireAdmin, ChatController.closeConversation);

router.post('/admin/conversations/:conversationId/reopen',
  authenticateToken, requireAdmin, ChatController.reopenConversation);

export default router;
