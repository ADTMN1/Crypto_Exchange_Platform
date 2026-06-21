import SupportService from '../services/support.service.js';
import auditController from './audit.controller.js';
import notificationService from '../services/notification.service.js';

const SupportController = {
    createTicket: async (req, res, next) => {
        try {
            const { subject, category, message } = req.body;
            
            // Get user info from authenticated request
            const userId = req.user.id;
            const name = req.user.username || req.user.email?.split('@')[0] || 'User';
            const email = req.user.email;
            
            const ipAddress = req.ip || req.connection.remoteAddress;

            const { ticket, finalIsSpam, finalSpamScore } = await SupportService.createTicket({
                name, 
                email, 
                subject, 
                category, 
                message, 
                userId, 
                ipAddress
            });

            if (finalIsSpam) {
                res.status(202).json({
                    success: true,
                    message: 'Your ticket has been received and is under review.',
                    data: { ticketId: ticket.id, status: 'under_review', createdAt: ticket.created_at }
                });
            } else {
                res.status(201).json({
                    success: true,
                    message: 'Support ticket created successfully',
                    data: { ticketId: ticket.id, status: ticket.status, createdAt: ticket.created_at }
                });
            }

            auditController.auditingSave(
                req,
                finalIsSpam ? 'Created support ticket (flagged as spam)' : 'Created support ticket',
                'support_ticket',
                ticket.id,
                { category, subject, spam_score: finalSpamScore }
            ).catch((err) => console.error('Audit save failed:', err));

            if (!finalIsSpam) {
              notificationService.sendAdminAlert({
                type: 'SUPPORT_TICKET_CREATED',
                title: 'New Support Ticket',
                body: `${name} opened a support ticket: "${subject}" (${category}).`,
                metadata: { ticketId: ticket.id, userId, category, subject },
              }).catch((err) => console.error('Admin alert (support ticket) failed:', err));
            }

        } catch (error) {
            next(error);
        }
    },

    getUserTickets: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { status, limit = 20, offset = 0 } = req.query;

            const { tickets, total } = await SupportService.getUserTickets({
                userId, status, limit, offset
            });

            res.status(200).json({
                success: true,
                data: tickets,
                pagination: { total, limit: parseInt(limit), offset: parseInt(offset) }
            });

            auditController.auditingSave(req, 'Viewed support tickets', 'support_ticket', null, { limit, offset, status })
                .catch((err) => console.error('Audit save failed:', err));

        } catch (error) {
            next(error);
        }
    },

    getTicketById: async (req, res, next) => {
        try {
            const { id } = req.params;
            const userId = req.user?.id;

            const ticket = await SupportService.getTicketById(id, userId);

            res.status(200).json({
                success: true,
                data: ticket
            });

            auditController.auditingSave(req, 'Viewed support ticket', 'support_ticket', ticket.id)
                .catch((err) => console.error('Audit save failed:', err));

        } catch (error) {
            next(error);
        }
    },

    getFAQs: async (req, res, next) => {
        try {
            const { category } = req.query;
            const faqs = await SupportService.getFAQs(category);

            return res.status(200).json({
                success: true,
                data: faqs
            });
        } catch (error) {
            next(error);
        }
    },

    // ============================================================================
    // ADMIN ENDPOINTS
    // ============================================================================

    getAllTickets: async (req, res, next) => {
        try {
            const { status, limit = 20, offset = 0, search } = req.query;

            const { tickets, total } = await SupportService.getAllTickets({
                status, limit, offset, search
            });

            res.status(200).json({
                success: true,
                data: tickets,
                pagination: { total, limit: parseInt(limit), offset: parseInt(offset) }
            });

            auditController.auditingSave(req, 'Viewed all support tickets', 'support_ticket', null, { status, limit, offset })
                .catch((err) => console.error('Audit save failed:', err));

        } catch (error) {
            next(error);
        }
    },

    getTicketCounts: async (req, res, next) => {
        try {
            const counts = await SupportService.getTicketCounts();

            res.status(200).json({
                success: true,
                data: counts
            });
        } catch (error) {
            next(error);
        }
    },

    getTicketWithReplies: async (req, res, next) => {
        try {
            const { id } = req.params;
            const ticket = await SupportService.getTicketWithReplies(id);

            res.status(200).json({
                success: true,
                data: ticket
            });

            auditController.auditingSave(req, 'Viewed support ticket with replies', 'support_ticket', id)
                .catch((err) => console.error('Audit save failed:', err));

        } catch (error) {
            next(error);
        }
    },

    replyToTicket: async (req, res, next) => {
        try {
            const { id } = req.params;
            const { message } = req.body;
            const userId = req.user.id;

            const reply = await SupportService.replyToTicket(id, userId, message);

            res.status(201).json({
                success: true,
                message: 'Reply added successfully',
                data: reply
            });

            auditController.auditingSave(req, 'Replied to support ticket', 'support_ticket', id)
                .catch((err) => console.error('Audit save failed:', err));

        } catch (error) {
            next(error);
        }
    },

    closeTicket: async (req, res, next) => {
        try {
            const { id } = req.params;
            const ticket = await SupportService.closeTicket(id);

            res.status(200).json({
                success: true,
                message: 'Ticket closed successfully',
                data: ticket
            });

            auditController.auditingSave(req, 'Closed support ticket', 'support_ticket', id)
                .catch((err) => console.error('Audit save failed:', err));

        } catch (error) {
            next(error);
        }
    },

    reopenTicket: async (req, res, next) => {
        try {
            const { id } = req.params;
            const ticket = await SupportService.reopenTicket(id);

            res.status(200).json({
                success: true,
                message: 'Ticket reopened successfully',
                data: ticket
            });

            auditController.auditingSave(req, 'Reopened support ticket', 'support_ticket', id)
                .catch((err) => console.error('Audit save failed:', err));

        } catch (error) {
            next(error);
        }
    }
};

export default SupportController;