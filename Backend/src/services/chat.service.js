import { query } from '../config/db.config.js';
import { emitToUser, io } from '../websocket/socket.js';
import AppError from '../utils/errorHandling.js';

const ChatService = {
  // ------------------------------------------------------------------
  // Get or create the single conversation for a user
  // ------------------------------------------------------------------
  getOrCreateConversation: async (userId) => {
    // Try to find existing
    const existing = await query(
      'SELECT * FROM support_conversations WHERE user_id = $1',
      [userId]
    );
    if (existing.rows.length > 0) return existing.rows[0];

    // Create new
    const created = await query(
      `INSERT INTO support_conversations (user_id, status)
       VALUES ($1, 'open')
       RETURNING *`,
      [userId]
    );
    return created.rows[0];
  },

  // ------------------------------------------------------------------
  // Get all messages for a conversation, ordered oldest → newest
  // ------------------------------------------------------------------
  getMessages: async (conversationId) => {
    const result = await query(
      `SELECT
         sm.id,
         sm.conversation_id,
         sm.sender_type,
         sm.sender_id,
         sm.message,
         sm.is_read,
         sm.created_at,
         u.username  AS sender_name,
         u.email     AS sender_email
       FROM support_messages sm
       LEFT JOIN users u ON u.id = sm.sender_id
       WHERE sm.conversation_id = $1
       ORDER BY sm.created_at ASC`,
      [conversationId]
    );
    return result.rows;
  },

  // ------------------------------------------------------------------
  // Save a new message and emit socket events
  // ------------------------------------------------------------------
  sendMessage: async ({ conversationId, senderId, senderType, message }) => {
    if (!message || !message.trim()) {
      throw new AppError('Message cannot be empty', 400);
    }

    // Make sure conversation exists
    const convCheck = await query(
      'SELECT * FROM support_conversations WHERE id = $1',
      [conversationId]
    );
    if (convCheck.rows.length === 0) {
      throw new AppError('Conversation not found', 404);
    }
    const conversation = convCheck.rows[0];

    if (conversation.status === 'closed' && senderType === 'user') {
      throw new AppError('This conversation is closed', 400);
    }

    // Insert message
    const inserted = await query(
      `INSERT INTO support_messages (conversation_id, sender_type, sender_id, message)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [conversationId, senderType, senderId, message.trim()]
    );

    // Touch updated_at on conversation
    await query(
      'UPDATE support_conversations SET updated_at = NOW() WHERE id = $1',
      [conversationId]
    );

    // Fetch with sender info
    const full = await query(
      `SELECT sm.*, u.username AS sender_name, u.email AS sender_email
       FROM support_messages sm
       LEFT JOIN users u ON u.id = sm.sender_id
       WHERE sm.id = $1`,
      [inserted.rows[0].id]
    );
    const savedMsg = full.rows[0];

    // Emit to the user's room (admin → user)
    if (senderType === 'admin') {
      emitToUser(conversation.user_id, 'support:new-message', {
        conversationId,
        message: savedMsg,
      });
    }

    // Emit to admin room (user → admin)
    if (io && io.to) {
      io.to('admin:support').emit('support:new-message', {
        conversationId,
        userId: conversation.user_id,
        message: savedMsg,
      });
    }

    return savedMsg;
  },

  // ------------------------------------------------------------------
  // Mark messages as read
  // ------------------------------------------------------------------
  markMessagesRead: async (conversationId, readerType) => {
    // If admin opens conversation → mark user messages as read
    // If user opens conversation → mark admin messages as read
    const senderTypeToMark = readerType === 'admin' ? 'user' : 'admin';

    await query(
      `UPDATE support_messages
       SET is_read = TRUE
       WHERE conversation_id = $1
         AND sender_type = $2
         AND is_read = FALSE`,
      [conversationId, senderTypeToMark]
    );
  },

  // ------------------------------------------------------------------
  // Get unread count for a user (admin messages they haven't read)
  // ------------------------------------------------------------------
  getUserUnreadCount: async (userId) => {
    const conv = await query(
      'SELECT id FROM support_conversations WHERE user_id = $1',
      [userId]
    );
    if (conv.rows.length === 0) return 0;

    const result = await query(
      `SELECT COUNT(*) FROM support_messages
       WHERE conversation_id = $1
         AND sender_type = 'admin'
         AND is_read = FALSE`,
      [conv.rows[0].id]
    );
    return parseInt(result.rows[0].count);
  },

  // ------------------------------------------------------------------
  // ADMIN: get all conversations with last message + unread count
  // ------------------------------------------------------------------
  getAllConversations: async ({ limit = 50, offset = 0, status }) => {
    let where = 'WHERE 1=1';
    const params = [];
    let i = 1;

    if (status && ['open', 'closed'].includes(status)) {
      where += ` AND sc.status = $${i++}`;
      params.push(status);
    }

    params.push(limit, offset);

    const result = await query(
      `SELECT
         sc.id,
         sc.user_id,
         sc.status,
         sc.created_at,
         sc.updated_at,
         u.username,
         u.email,
         (SELECT COUNT(*) FROM support_messages
          WHERE conversation_id = sc.id
            AND sender_type = 'user'
            AND is_read = FALSE) AS unread_count,
         (SELECT message FROM support_messages
          WHERE conversation_id = sc.id
          ORDER BY created_at DESC LIMIT 1) AS last_message,
         (SELECT created_at FROM support_messages
          WHERE conversation_id = sc.id
          ORDER BY created_at DESC LIMIT 1) AS last_message_at
       FROM support_conversations sc
       LEFT JOIN users u ON u.id = sc.user_id
       ${where}
       ORDER BY sc.updated_at DESC
       LIMIT $${i} OFFSET $${i + 1}`,
      params
    );

    const countResult = await query(
      `SELECT COUNT(*) FROM support_conversations sc ${where.replace(/\$\d+/g, (m) => {
        const n = parseInt(m.slice(1));
        return `$${n}`;
      })}`,
      params.slice(0, -2)
    );

    return {
      conversations: result.rows,
      total: parseInt(countResult.rows[0].count),
    };
  },

  // ------------------------------------------------------------------
  // ADMIN: close / reopen a conversation
  // ------------------------------------------------------------------
  closeConversation: async (conversationId) => {
    const result = await query(
      `UPDATE support_conversations
       SET status = 'closed', updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [conversationId]
    );
    if (result.rows.length === 0) throw new AppError('Conversation not found', 404);
    return result.rows[0];
  },

  reopenConversation: async (conversationId) => {
    const result = await query(
      `UPDATE support_conversations
       SET status = 'open', updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [conversationId]
    );
    if (result.rows.length === 0) throw new AppError('Conversation not found', 404);
    return result.rows[0];
  },

  // ------------------------------------------------------------------
  // Admin total unread count (user messages not yet read)
  // ------------------------------------------------------------------
  getAdminUnreadCount: async () => {
    const result = await query(
      `SELECT COUNT(*) FROM support_messages
       WHERE sender_type = 'user' AND is_read = FALSE`
    );
    return parseInt(result.rows[0].count);
  },
};

export default ChatService;
