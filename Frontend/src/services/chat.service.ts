import api from './api.service'

export interface SupportConversation {
  id: string
  user_id: string
  status: 'open' | 'closed'
  created_at: string
  updated_at: string
  // admin list extras
  username?: string
  email?: string
  unread_count?: number
  last_message?: string
  last_message_at?: string
  last_message_sender_type?: 'user' | 'admin'
}

export interface SupportMessage {
  id: string
  conversation_id: string
  sender_type: 'user' | 'admin'
  sender_id: string
  message: string
  is_read: boolean
  created_at: string
  sender_name?: string
  sender_email?: string
}

const chatService = {
  // ── User ──────────────────────────────────────────────────────────

  /** Get or create the user's conversation */
  getConversation(): Promise<{ data: SupportConversation }> {
    return api.get('/support/conversation').then(r => r.data)
  },

  /** Load all messages (also marks admin messages as read) */
  getMessages(): Promise<{ data: SupportMessage[] }> {
    return api.get('/support/messages').then(r => r.data)
  },

  /** Send a message as user */
  sendMessage(message: string): Promise<{ data: SupportMessage }> {
    return api.post('/support/messages', { message }).then(r => r.data)
  },

  /** How many unread admin replies */
  getUserUnreadCount(): Promise<{ data: { count: number } }> {
    return api.get('/support/unread-count').then(r => r.data)
  },

  // ── Admin ─────────────────────────────────────────────────────────

  /** Get all user conversations */
  getAllConversations(params?: {
    limit?: number
    offset?: number
    status?: string
  }): Promise<{ data: SupportConversation[]; total: number }> {
    return api.get('/support/admin/conversations', { params }).then(r => r.data)
  },

  /** Admin: load messages for a conversation (marks user msgs as read) */
  getConversationMessages(conversationId: string): Promise<{ data: SupportMessage[] }> {
    return api
      .get(`/support/admin/conversations/${conversationId}/messages`)
      .then(r => r.data)
  },

  /** Admin: reply to a conversation */
  adminSendMessage(
    conversationId: string,
    message: string
  ): Promise<{ data: SupportMessage }> {
    return api
      .post(`/support/admin/conversations/${conversationId}/messages`, { message })
      .then(r => r.data)
  },

  /** Admin: close a conversation */
  closeConversation(conversationId: string): Promise<{ data: SupportConversation }> {
    return api
      .post(`/support/admin/conversations/${conversationId}/close`)
      .then(r => r.data)
  },

  /** Admin: reopen a conversation */
  reopenConversation(conversationId: string): Promise<{ data: SupportConversation }> {
    return api
      .post(`/support/admin/conversations/${conversationId}/reopen`)
      .then(r => r.data)
  },

  /** Admin: total unread messages from users */
  getAdminUnreadCount(): Promise<{ data: { count: number } }> {
    return api.get('/support/admin/unread-count').then(r => r.data)
  },
}

export default chatService
