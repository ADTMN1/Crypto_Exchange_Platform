import api from './api.service'

interface Ticket {
  id: string
  subject: string
  category: string
  message: string
  status: 'open' | 'pending' | 'resolved' | 'closed'
  created_at: string
  updated_at: string
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

const supportService = {
  /**
   * Create a support ticket
   */
  async createTicket(data: CreateTicketData): Promise<Ticket> {
    const response = await api.post('/support/tickets', data)
    return response.data
  },

  /**
   * Get user's support tickets
   */
  async getUserTickets(params?: { status?: string; limit?: number }): Promise<{ data: Ticket[] }> {
    const response = await api.get('/support/my-tickets', { params })
    return response.data
  },

  /**
   * Get specific ticket by ID
   */
  async getTicketById(id: string): Promise<Ticket> {
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
}

export default supportService
