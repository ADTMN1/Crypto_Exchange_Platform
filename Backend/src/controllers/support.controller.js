import { query, pool } from '../config/db.config.js';

const SupportController = {
    /**
     * Create a new support ticket
     */
    createTicket: async (req, res, next) => {
        const { name, email, subject, category, message } = req.body;
        const userId = req.user?.id || null; // Optional if user is logged in

        try {
            // Validate required fields
            if (!name || !email || !subject || !category || !message) {
                const error = new Error('All fields are required');
                error.statusCode = 400;
                throw error;
            }

            // Insert support ticket
            const ticketQuery = `
                INSERT INTO support_tickets (user_id, name, email, subject, category, message, status)
                VALUES ($1, $2, $3, $4, $5, $6, 'open')
                RETURNING id, name, email, subject, category, status, created_at;
            `;

            const result = await query(ticketQuery, [
                userId,
                name,
                email,
                subject,
                category,
                message
            ]);

            const ticket = result.rows[0];

            // TODO: Send email notification to support team
            // TODO: Send confirmation email to user

            return res.status(201).json({
                success: true,
                message: 'Support ticket created successfully',
                data: {
                    ticketId: ticket.id,
                    status: ticket.status,
                    createdAt: ticket.created_at
                }
            });
        } catch (error) {
            console.error('Create ticket error:', error);
            next(error);
        }
    },

    /**
     * Get user's support tickets (authenticated users only)
     */
    getUserTickets: async (req, res, next) => {
        const userId = req.user.id;
        const { status, limit = 20, offset = 0 } = req.query;

        try {
            let queryString = `
                SELECT 
                    id, subject, category, status, 
                    created_at, updated_at, resolved_at
                FROM support_tickets
                WHERE user_id = $1
            `;

            const params = [userId];
            let paramIndex = 2;

            // Filter by status
            if (status && ['open', 'in_progress', 'resolved', 'closed'].includes(status)) {
                queryString += ` AND status = $${paramIndex}`;
                params.push(status);
                paramIndex++;
            }

            queryString += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
            params.push(limit, offset);

            const result = await query(queryString, params);

            // Get total count
            const countResult = await query(
                'SELECT COUNT(*) FROM support_tickets WHERE user_id = $1',
                [userId]
            );

            return res.status(200).json({
                success: true,
                data: result.rows,
                pagination: {
                    total: parseInt(countResult.rows[0].count),
                    limit: parseInt(limit),
                    offset: parseInt(offset)
                }
            });
        } catch (error) {
            console.error('Get user tickets error:', error);
            next(error);
        }
    },

    /**
     * Get ticket details
     */
    getTicketById: async (req, res, next) => {
        const { id } = req.params;
        const userId = req.user?.id;

        try {
            const ticketQuery = `
                SELECT 
                    id, user_id, name, email, subject, category, 
                    message, status, created_at, updated_at, resolved_at
                FROM support_tickets
                WHERE id = $1
            `;

            const result = await query(ticketQuery, [id]);

            if (result.rows.length === 0) {
                const error = new Error('Ticket not found');
                error.statusCode = 404;
                throw error;
            }

            const ticket = result.rows[0];

            // Check if user owns this ticket (if authenticated)
            if (userId && ticket.user_id !== userId) {
                const error = new Error('Unauthorized access to ticket');
                error.statusCode = 403;
                throw error;
            }

            return res.status(200).json({
                success: true,
                data: ticket
            });
        } catch (error) {
            console.error('Get ticket error:', error);
            next(error);
        }
    },

    /**
     * Get FAQ categories and items
     */
    getFAQs: async (req, res, next) => {
        const { category } = req.query;

        try {
            let queryString = `
                SELECT id, category, question, answer, sort_order
                FROM faqs
                WHERE is_active = true
            `;

            const params = [];

            if (category) {
                queryString += ` AND category = $1`;
                params.push(category);
            }

            queryString += ` ORDER BY sort_order ASC, created_at DESC`;

            const result = await query(queryString, params);

            return res.status(200).json({
                success: true,
                data: result.rows
            });
        } catch (error) {
            console.error('Get FAQs error:', error);
            next(error);
        }
    }
};

export default SupportController;
