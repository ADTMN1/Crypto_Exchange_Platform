import api from './api.service'

interface Ticket {
  id: string
  ticket_number: string
  subject: string
  description: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high'
  created_at: string
  updated_at: string
  closed_at?: string
  username?: string
  email?: string
  reply_count?: number
}

interface TicketWithReplies extends Ticket {
  user_name: string
  user_email: string
  replies: Reply[]
}

interface Reply {
  id: string
  ticket_id: string
  user_id: string
  message: string
  is_admin: boolean
  created_at: string
  username: string
  email: string
}

interface FAQ {
  id: string
  question: string
  answer: string
  category: string
}

interface CreateTicketData {
  name: string
  email: string
  subject: string
  category: string
  message: string
}

interface TicketCounts {
  all: number
  open: number
  in_progress: number
  resolved: number
  closed: number
}

const supportService = {
  /**
   * Create a support ticket
   */
  async createTicket(data: CreateTicketData): Promise<{ data: Ticket }> {
    const response = await api.post('/support/tickets', data)
    return response.data
  },

  /**
   * Get user's support tickets
   */
  async getUserTickets(params?: { status?: string; limit?: number }): Promise<{ data: Ticket[]; pagination: any }> {
    const response = await api.get('/support/my-tickets', { params })
    return response.data
  },

  /**
   * Get specific ticket by ID
   */
  async getTicketById(id: string): Promise<{ data: Ticket }> {
    const response = await api.get(`/support/tickets/${id}`)
    return response.data
  },

  /**
   * Get FAQs
   */
  async getFAQs(category?: string): Promise<{ data: FAQ[] }> {
    const response = await api.get('/support/faqs', { params: { category } })
    return response.data
  },

  // ============================================================================
  // ADMIN ENDPOINTS
  // ============================================================================

  /**
   * Get all tickets (admin)
   */
  async getAllTickets(params?: { status?: string; limit?: number; offset?: number; search?: string }): Promise<{ data: Ticket[]; pagination: any }> {
    const response = await api.get('/support/admin/tickets', { params })
    return response.data
  },

  /**
   * Get ticket counts by status (admin)
   */
  async getTicketCounts(): Promise<{ data: TicketCounts }> {
    const response = await api.get('/support/admin/counts')
    return response.data
  },

  /**
   * Get ticket with replies (admin)
   */
  async getTicketWithReplies(id: string): Promise<{ data: TicketWithReplies }> {
    const response = await api.get(`/support/admin/tickets/${id}/details`)
    return response.data
  },

  /**
   * Reply to ticket (admin)
   */
  async replyToTicket(id: string, message: string): Promise<{ data: Reply }> {
    const response = await api.post(`/support/admin/tickets/${id}/reply`, { message })
    return response.data
  },

  /**
   * Close ticket (admin)
   */
  async closeTicket(id: string): Promise<{ data: Ticket }> {
    const response = await api.post(`/support/admin/tickets/${id}/close`)
    return response.data
  },

  /**
   * Reopen ticket (admin)
   */
  async reopenTicket(id: string): Promise<{ data: Ticket }> {
    const response = await api.post(`/support/admin/tickets/${id}/reopen`)
    return response.data
  },
}

export default supportService
export type { Ticket, TicketWithReplies, Reply, FAQ, CreateTicketData, TicketCounts }
