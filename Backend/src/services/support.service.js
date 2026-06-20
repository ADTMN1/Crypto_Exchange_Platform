import { query } from '../config/db.config.js';
import spamDetectionService from './spamDetection.service.js';
import blacklistService from './blacklist.service.js';
import AppError from '../utils/errorHandling.js';

const SupportService = {
    generateTicketNumber: () => {
        return `TK-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    },

    createTicket: async ({ name, email, subject, category, message, userId, ipAddress }) => {
        if (!name || !email || !subject || !category || !message) {
            throw new AppError('All fields are required', 400);
        }

        if (!spamDetectionService.isValidEmail(email)) {
            throw new AppError('Invalid email address format', 400);
        }

        const blacklistCheck = await blacklistService.shouldBlockTicket(
            { email, name, subject, message },
            ipAddress
        );

        if (blacklistCheck.shouldBlock) {
            await query(
                `INSERT INTO spam_logs (email, ip_address, spam_score, is_spam, confidence, detection_reasons, action_taken)
                 VALUES ($1, $2, 100, true, 'high', $3, 'blocked')`,
                [email, ipAddress, [blacklistCheck.reason]]
            );

            throw new AppError('Unable to process your request. Please contact support directly.', 403);
        }

        const spamAnalysis = spamDetectionService.detectSpam({ name, email, subject, message });

        if (spamAnalysis.isSpam && spamAnalysis.confidence === 'high') {
            await query(
                `INSERT INTO spam_logs (email, ip_address, spam_score, is_spam, confidence, detection_reasons, action_taken)
                 VALUES ($1, $2, $3, true, $4, $5, 'blocked')`,
                [email, ipAddress, spamAnalysis.score, spamAnalysis.confidence, spamAnalysis.reasons]
            );

            if (spamAnalysis.score > 60) {
                await blacklistService.addEmailToBlacklist(
                    email,
                    `Auto-blacklisted: Spam score ${spamAnalysis.score}`,
                    null
                );
            }

            throw new AppError('Your ticket could not be submitted. Please ensure your message follows our guidelines.', 400);
        }

        const hasLegitimatePatterns = spamDetectionService.hasLegitimatePatterns({ subject, message });
        const finalSpamScore = hasLegitimatePatterns ? Math.max(0, spamAnalysis.score - 15) : spamAnalysis.score;
        const finalIsSpam = finalSpamScore >= 30;
        const status = 'open';

        const ticketNumber = SupportService.generateTicketNumber();
        const ticketQuery = `
            INSERT INTO support_tickets (
                user_id, ticket_number, subject, description, status, priority, created_at, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, 'medium', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING id, ticket_number, subject, status, created_at;
        `;

        const result = await query(ticketQuery, [userId, ticketNumber, subject, message, status]);
        const ticket = result.rows[0];

        await query(
            `INSERT INTO spam_logs (ticket_id, email, ip_address, spam_score, is_spam, confidence, detection_reasons, action_taken)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
                ticket.id,
                email,
                ipAddress,
                finalSpamScore,
                finalIsSpam,
                spamAnalysis.confidence,
                spamAnalysis.reasons,
                finalIsSpam ? 'flagged_as_spam' : 'allowed'
            ]
        );

        return { ticket, finalIsSpam, finalSpamScore };
    },

    getUserTickets: async ({ userId, status, limit = 20, offset = 0 }) => {
        let queryString = `
            SELECT id, ticket_number, subject, description, status, priority, created_at, updated_at
            FROM support_tickets
            WHERE user_id = $1
        `;

        const params = [userId];
        let paramIndex = 2;

        if (status && ['open', 'in_progress', 'resolved', 'closed'].includes(status)) {
            queryString += ` AND status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        queryString += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, offset);

        const result = await query(queryString, params);

        const countResult = await query(
            'SELECT COUNT(*) FROM support_tickets WHERE user_id = $1',
            [userId]
        );

        return {
            tickets: result.rows,
            total: parseInt(countResult.rows[0].count)
        };
    },

    getTicketById: async (id, userId) => {
        const ticketQuery = `
            SELECT 
                t.*,
                (SELECT json_agg(
                    json_build_object(
                        'id', r.id,
                        'ticket_id', r.ticket_id,
                        'user_id', r.user_id,
                        'message', r.message,
                        'is_admin', r.is_admin,
                        'created_at', r.created_at,
                        'username', u2.username,
                        'email', u2.email
                    ) ORDER BY r.created_at ASC
                ) FROM ticket_replies r
                LEFT JOIN users u2 ON r.user_id = u2.id
                WHERE r.ticket_id = t.id
                ) as replies
            FROM support_tickets t
            WHERE t.id = $1
        `;

        const result = await query(ticketQuery, [id]);

        if (result.rows.length === 0) {
            throw new AppError('Ticket not found', 404);
        }

        const ticket = result.rows[0];

        if (userId && ticket.user_id !== userId) {
            throw new AppError('Unauthorized access to ticket', 403);
        }

        return ticket;
    },

    getFAQs: async (category) => {
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
        return result.rows;
    },

    // ADMIN FUNCTIONS
    getAllTickets: async ({ status, limit = 20, offset = 0, search }) => {
        let queryString = `
            SELECT 
                t.id, t.ticket_number, t.subject, t.description, t.status, 
                t.priority, t.created_at, t.updated_at, t.closed_at,
                u.username, u.email,
                (SELECT COUNT(*) FROM ticket_replies WHERE ticket_id = t.id) as reply_count
            FROM support_tickets t
            LEFT JOIN users u ON t.user_id = u.id
            WHERE 1=1
        `;

        const params = [];
        let paramIndex = 1;

        if (status && ['open', 'in_progress', 'resolved', 'closed'].includes(status)) {
            queryString += ` AND t.status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        if (search) {
            queryString += ` AND (t.subject ILIKE $${paramIndex} OR t.ticket_number ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        queryString += ` ORDER BY t.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, offset);

        const result = await query(queryString, params);

        let countQuery = 'SELECT COUNT(*) FROM support_tickets WHERE 1=1';
        const countParams = [];
        if (status && ['open', 'in_progress', 'resolved', 'closed'].includes(status)) {
            countQuery += ' AND status = $1';
            countParams.push(status);
        }
        
        const countResult = await query(countQuery, countParams);

        return {
            tickets: result.rows,
            total: parseInt(countResult.rows[0].count)
        };
    },

    getTicketCounts: async () => {
        const result = await query(`
            SELECT 
                status,
                COUNT(*) as count
            FROM support_tickets
            GROUP BY status
        `);

        const counts = {
            all: 0,
            open: 0,
            in_progress: 0,
            resolved: 0,
            closed: 0
        };

        result.rows.forEach(row => {
            counts[row.status] = parseInt(row.count);
            counts.all += parseInt(row.count);
        });

        return counts;
    },

    getTicketWithReplies: async (ticketId) => {
        const ticketQuery = `
            SELECT 
                t.*,
                u.username as user_name,
                u.email as user_email
            FROM support_tickets t
            LEFT JOIN users u ON t.user_id = u.id
            WHERE t.id = $1
        `;

        const ticketResult = await query(ticketQuery, [ticketId]);

        if (ticketResult.rows.length === 0) {
            throw new AppError('Ticket not found', 404);
        }

        const repliesQuery = `
            SELECT 
                r.*,
                u.username,
                u.email
            FROM ticket_replies r
            LEFT JOIN users u ON r.user_id = u.id
            WHERE r.ticket_id = $1
            ORDER BY r.created_at ASC
        `;

        const repliesResult = await query(repliesQuery, [ticketId]);

        return {
            ...ticketResult.rows[0],
            replies: repliesResult.rows
        };
    },

    replyToTicket: async (ticketId, userId, message) => {
        if (!message || message.trim().length === 0) {
            throw new AppError('Reply message is required', 400);
        }

        const replyQuery = `
            INSERT INTO ticket_replies (ticket_id, user_id, message, is_admin, created_at)
            VALUES ($1, $2, $3, true, CURRENT_TIMESTAMP)
            RETURNING *
        `;

        const replyResult = await query(replyQuery, [ticketId, userId, message.trim()]);

        const updateQuery = `
            UPDATE support_tickets
            SET status = 'in_progress',
                last_reply_at = CURRENT_TIMESTAMP,
                last_reply_by = $2,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
        `;

        await query(updateQuery, [ticketId, userId]);

        return replyResult.rows[0];
    },

    closeTicket: async (ticketId) => {
        const updateQuery = `
            UPDATE support_tickets
            SET status = 'closed',
                closed_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
        `;

        const result = await query(updateQuery, [ticketId]);

        if (result.rows.length === 0) {
            throw new AppError('Ticket not found', 404);
        }

        return result.rows[0];
    },

    reopenTicket: async (ticketId) => {
        const updateQuery = `
            UPDATE support_tickets
            SET status = 'open',
                closed_at = NULL,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
        `;

        const result = await query(updateQuery, [ticketId]);

        if (result.rows.length === 0) {
            throw new AppError('Ticket not found', 404);
        }

        return result.rows[0];
    }
};

export default SupportService;
