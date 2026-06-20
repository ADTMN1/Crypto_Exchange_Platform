import { Router } from 'express';
import SupportController from '../controllers/support.controller.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.midlware.js';

const router = Router();

// Public routes (no authentication required)

// Get FAQs (public access)
// GET /api/support/faqs?category=trading
router.get('/faqs', SupportController.getFAQs);

// Protected routes (authentication required)

// Create support ticket (authenticated users only)
// POST /api/support/tickets
router.post('/tickets', authenticateToken, SupportController.createTicket);

// Get user's support tickets
// GET /api/support/my-tickets?status=open&limit=20
router.get('/my-tickets', authenticateToken, SupportController.getUserTickets);

// Get specific ticket details
// GET /api/support/tickets/:id
router.get('/tickets/:id', authenticateToken, SupportController.getTicketById);

// ============================================================================
// ADMIN ONLY ROUTES
// ============================================================================

router.use(authenticateToken);
router.use(requireAdmin);

// Get all tickets (admin)
// GET /api/support/admin/tickets?status=open&limit=20&offset=0&search=keyword
router.get('/admin/tickets', SupportController.getAllTickets);

// Get ticket counts by status (admin)
// GET /api/support/admin/counts
router.get('/admin/counts', SupportController.getTicketCounts);

// Get ticket with replies (admin)
// GET /api/support/admin/tickets/:id/details
router.get('/admin/tickets/:id/details', SupportController.getTicketWithReplies);

// Reply to ticket (admin)
// POST /api/support/admin/tickets/:id/reply
router.post('/admin/tickets/:id/reply', SupportController.replyToTicket);

// Close ticket (admin)
// POST /api/support/admin/tickets/:id/close
router.post('/admin/tickets/:id/close', SupportController.closeTicket);

// Reopen ticket (admin)
// POST /api/support/admin/tickets/:id/reopen
router.post('/admin/tickets/:id/reopen', SupportController.reopenTicket);

export default router;
