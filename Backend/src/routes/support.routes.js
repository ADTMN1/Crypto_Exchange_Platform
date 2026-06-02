import { Router } from 'express';
import SupportController from '../controllers/support.controller.js';
import { authMiddleware } from '../middleware/auth.midlware.js';

const router = Router();

// Public routes (no authentication required)

// Create support ticket (can be used by guests or authenticated users)
// POST /api/support/tickets
router.post('/tickets', SupportController.createTicket);

// Get FAQs (public access)
// GET /api/support/faqs?category=trading
router.get('/faqs', SupportController.getFAQs);

// Protected routes (authentication required)

// Get user's support tickets
// GET /api/support/my-tickets?status=open&limit=20
router.get('/my-tickets', authMiddleware, SupportController.getUserTickets);

// Get specific ticket details
// GET /api/support/tickets/:id
router.get('/tickets/:id', SupportController.getTicketById);

export default router;
