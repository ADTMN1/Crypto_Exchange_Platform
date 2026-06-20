import { query } from '../config/db.config.js';
import auditController from './audit.controller.js';

const HistoryController = {
    /**
     * Get user's transaction history (deposits & withdrawals)
     */
    getTransactions: async (req, res, next) => {
        const userId = req.user.id;
        const { type, status, limit = 50, offset = 0 } = req.query;

        try {
            let queryString = `
                SELECT 
                    t.id,
                    t.type,
                    t.currency,
                    t.amount,
                    t.fee,
                    t.status,
                    t.confirmed_at,
                    t.created_at
                FROM transactions t
                WHERE t.user_id = $1
            `;
            
            const params = [userId];
            let paramIndex = 2;

            // Filter by type (deposit/withdrawal)
            if (type && ['deposit', 'withdrawal'].includes(type)) {
                queryString += ` AND t.type = $${paramIndex}`;
                params.push(type);
                paramIndex++;
            }

            // Filter by status
            if (status && ['pending', 'completed', 'failed'].includes(status)) {
                queryString += ` AND t.status = $${paramIndex}`;
                params.push(status);
                paramIndex++;
            }

            queryString += ` ORDER BY t.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
            params.push(limit, offset);

            const result = await query(queryString, params);

            // Get total count for pagination
            const countResult = await query(
                'SELECT COUNT(*) FROM transactions WHERE user_id = $1',
                [userId]
            );

            res.status(200).json({
                success: true,
                data: result.rows,
                pagination: {
                    total: parseInt(countResult.rows[0].count),
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                }
            });
            auditController.auditingSave(req, 'Viewed transactions', 'history', null, { type, status, limit, offset })
                .catch((err) => console.error('Audit save failed:', err));
            return;
        } catch (error) {
            console.error('Get transactions error:', error);
            next(error);
        }
    },

    /**
     * Get user's trade history
     */
    getTrades: async (req, res, next) => {
        const userId = req.user.id;
        const { pair, limit = 50, offset = 0 } = req.query;

        try {
            let queryString = `
                SELECT 
                    t.id,
                    tp.base_currency,
                    tp.quote_currency,
                    CONCAT(tp.base_currency, '/', tp.quote_currency) as pair,
                    CASE 
                        WHEN t.buyer_id = $1 THEN 'buy'
                        ELSE 'sell'
                    END as side,
                    t.price,
                    t.quantity,
                    (t.price * t.quantity) as total,
                    CASE 
                        WHEN t.buyer_id = $1 THEN t.buyer_fee
                        ELSE t.seller_fee
                    END as fee,
                    t.executed_at
                FROM trades t
                JOIN trading_pairs tp ON t.pair_id = tp.id
                WHERE t.buyer_id = $1 OR t.seller_id = $1
            `;
            
            const params = [userId];
            let paramIndex = 2;

            // Filter by pair
            if (pair) {
                const [base, quote] = pair.split('/');
                if (base && quote) {
                    queryString += ` AND tp.base_currency = $${paramIndex} AND tp.quote_currency = $${paramIndex + 1}`;
                    params.push(base, quote);
                    paramIndex += 2;
                }
            }

            queryString += ` ORDER BY t.executed_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
            params.push(limit, offset);

            const result = await query(queryString, params);

            // Get total count
            const countResult = await query(
                'SELECT COUNT(*) FROM trades WHERE buyer_id = $1 OR seller_id = $1',
                [userId]
            );

            res.status(200).json({
                success: true,
                data: result.rows,
                pagination: {
                    total: parseInt(countResult.rows[0].count),
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                }
            });
            auditController.auditingSave(req, 'Viewed trades', 'history', null, { pair, limit, offset })
                .catch((err) => console.error('Audit save failed:', err));
            return;
        } catch (error) {
            console.error('Get trades error:', error);
            next(error);
        }
    },

    /**
     * Get user's order history
     */
    getOrders: async (req, res, next) => {
        const userId = req.user.id;
        const { status, pair, limit = 50, offset = 0 } = req.query;

        try {
            let queryString = `
                SELECT 
                    o.id,
                    tp.base_currency,
                    tp.quote_currency,
                    CONCAT(tp.base_currency, '/', tp.quote_currency) as pair,
                    o.type,
                    o.side,
                    o.status,
                    o.price,
                    o.quantity,
                    o.filled_qty,
                    o.avg_fill_price,
                    o.fee,
                    o.fee_currency,
                    o.created_at,
                    o.updated_at,
                    o.cancelled_at
                FROM orders o
                JOIN trading_pairs tp ON o.pair_id = tp.id
                WHERE o.user_id = $1
            `;
            
            const params = [userId];
            let paramIndex = 2;

            // Filter by status
            if (status && ['open', 'partially_filled', 'filled', 'cancelled'].includes(status)) {
                queryString += ` AND o.status = $${paramIndex}`;
                params.push(status);
                paramIndex++;
            }

            // Filter by pair
            if (pair) {
                const [base, quote] = pair.split('/');
                if (base && quote) {
                    queryString += ` AND tp.base_currency = $${paramIndex} AND tp.quote_currency = $${paramIndex + 1}`;
                    params.push(base, quote);
                    paramIndex += 2;
                }
            }

            queryString += ` ORDER BY o.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
            params.push(limit, offset);

            const result = await query(queryString, params);

            // Get total count
            const countResult = await query(
                'SELECT COUNT(*) FROM orders WHERE user_id = $1',
                [userId]
            );

            res.status(200).json({
                success: true,
                data: result.rows,
                pagination: {
                    total: parseInt(countResult.rows[0].count),
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                }
            });
            auditController.auditingSave(req, 'Viewed orders', 'history', null, { status, pair, limit, offset })
                .catch((err) => console.error('Audit save failed:', err));
            return;
        } catch (error) {
            console.error('Get orders error:', error);
            next(error);
        }
    },

    /**
     * Get complete history summary (all types)
     */
    getSummary: async (req, res, next) => {
        const userId = req.user.id;

        try {
            // Get counts and totals for each type
            const transactionsCount = await query(
                'SELECT COUNT(*) as count, type FROM transactions WHERE user_id = $1 GROUP BY type',
                [userId]
            );

            const tradesCount = await query(
                'SELECT COUNT(*) as count FROM trades WHERE buyer_id = $1 OR seller_id = $1',
                [userId]
            );

            const ordersCount = await query(
                'SELECT COUNT(*) as count, status FROM orders WHERE user_id = $1 GROUP BY status',
                [userId]
            );

            // Calculate total volume (last 30 days)
            const volumeResult = await query(
                `SELECT SUM(price * quantity) as total_volume
                 FROM trades
                 WHERE (buyer_id = $1 OR seller_id = $1)
                 AND executed_at >= NOW() - INTERVAL '30 days'`,
                [userId]
            );

            res.status(200).json({
                success: true,
                data: {
                    transactions: transactionsCount.rows,
                    trades: parseInt(tradesCount.rows[0]?.count || 0),
                    orders: ordersCount.rows,
                    totalVolume30d: volumeResult.rows[0]?.total_volume || '0',
                }
            });
            auditController.auditingSave(req, 'Viewed history summary', 'history', req.user.id)
                .catch((err) => console.error('Audit save failed:', err));
            return;
        } catch (error) {
            console.error('Get history summary error:', error);
            next(error);
        }
    }
};

export default HistoryController;
