import pool, { query } from '../config/db.config.js';
import AppError from '../utils/errorHandling.js';

const transactionService = {
    /**
     * Creates a new financial transaction trace.
     * Uses a leased pool client for transactional safety across the ledger.
     */
    createTransaction: async (transactionData) => {
        const {
            user_id,
            wallet_id,
            type,
            currency,
            amount,
            fee = 0,
            status = 'pending',
            tx_hash = null,
            from_address = null,
            to_address = null,
            confirmations = 0
        } = transactionData;

        if (!user_id || !wallet_id || !type || !currency || !amount) {
            throw new AppError('Missing structural identity or amount variables for ledger insertion.', 400);
        }

        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // 1. Verify wallet balance requirements if it is a WITHDRAWAL or TRADE out
            if (['withdrawal', 'trade_out'].includes(type.toLowerCase())) {
                const walletCheck = await client.query(
                    'SELECT balance FROM wallets WHERE id = $1 AND user_id = $2 FOR UPDATE',
                    [wallet_id, user_id]
                );

                if (walletCheck.rows.length === 0) {
                    throw new AppError('Target wallet asset structure not found.', 444);
                }

                const totalDeduction = parseFloat(amount) + parseFloat(fee);
                if (parseFloat(walletCheck.rows[0].balance) < totalDeduction) {
                    throw new AppError('Insufficient balance to execute this ledger transaction.', 400);
                }
            }

            // 2. Insert transaction trace record
            const insertQuery = `
                INSERT INTO transactions (
                    user_id, wallet_id, type, currency, amount, fee, 
                    status, tx_hash, from_address, to_address, confirmations, confirmed_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                RETURNING *;
            `;

            const confirmedAt = status === 'completed' ? new Date() : null;

            const values = [
                user_id, wallet_id, type, currency, amount, fee, 
                status, tx_hash, from_address, to_address, confirmations, confirmedAt
            ];

            const result = await client.query(insertQuery, values);
            
            await client.query('COMMIT');
            return result.rows[0];

        } catch (error) {
            await client.query('ROLLBACK');
            if (error instanceof AppError) throw error;
            throw new AppError(error.message || 'Failed to create financial transaction sequence.', 500);
        } finally {
            client.release();
        }
    },

    /**
     * Retrieves a unique transaction details line using standard identity lookup vectors.
     */
    getTransactionById: async (transactionId) => {
        if (!transactionId) throw new AppError('Transaction identification parameter is missing.', 400);

        const sql = `SELECT * FROM transactions WHERE id = $1 LIMIT 1;`;
        const result = await query(sql, [transactionId]);
        return result.rows[0] || null;
    },

    /**
     * Mutates an ongoing transaction state (e.g., confirmation counters or hash modifications).
     */
    updateTransaction: async (transactionId, updateData) => {
        if (!transactionId) throw new AppError('Transaction reference parameter missing.', 400);

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Fetch structural entity baseline
            const check = await client.query('SELECT status, wallet_id, amount, type FROM transactions WHERE id = $1 FOR UPDATE', [transactionId]);
            if (check.rows.length === 0) throw new AppError('Transaction history line target not found.', 404);

            const currentTx = check.rows[0];

            // Formulate dynamic properties modification query
            const fields = [];
            const values = [];
            let placeholderIndex = 1;

            if (updateData.status) {
                fields.push(`status = $${placeholderIndex++}`);
                values.push(updateData.status);
                
                if (updateData.status === 'completed' && currentTx.status !== 'completed') {
                    fields.push(`confirmed_at = $${placeholderIndex++}`);
                    values.push(new Date());
                }
            }
            if (updateData.tx_hash !== undefined) {
                fields.push(`tx_hash = $${placeholderIndex++}`);
                values.push(updateData.tx_hash);
            }
            if (updateData.confirmations !== undefined) {
                fields.push(`confirmations = $${placeholderIndex++}`);
                values.push(updateData.confirmations);
            }

            if (fields.length === 0) {
                await client.query('ROLLBACK');
                return currentTx;
            }

            values.push(transactionId);
            const updateSql = `
                UPDATE transactions 
                SET ${fields.join(', ')} 
                WHERE id = $${placeholderIndex} 
                RETURNING *;
            `;

            const result = await client.query(updateSql, values);
            await client.query('COMMIT');
            return result.rows[0];

        } catch (error) {
            await client.query('ROLLBACK');
            if (error instanceof AppError) throw error;
            throw new AppError(error.message || 'Mutation sequence on transaction entity failed.', 500);
        } finally {
            client.release();
        }
    },

    /**
     * Lists ledger transaction chains with paginated filtering optimizations.
     */
    listTransactions: async (filterOptions = {}) => {
        const { user_id, type, currency, status, limit = 20, offset = 0 } = filterOptions;
        
        const conditions = [];
        const values = [];
        let index = 1;

        if (user_id) {
            conditions.push(`user_id = $${index++}`);
            values.push(user_id);
        }
        if (type) {
            conditions.push(`type = $${index++}`);
            values.push(type);
        }
        if (currency) {
            conditions.push(`currency = $${index++}`);
            values.push(currency);
        }
        if (status) {
            conditions.push(`status = $${index++}`);
            values.push(status);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        
        values.push(limit, offset);
        const listSql = `
            SELECT * FROM transactions 
            ${whereClause} 
            ORDER BY created_at DESC 
            LIMIT $${index++} OFFSET $${index};
        `;

        const result = await query(listSql, values);
        return result.rows;
    },

    /**
     * Admin: lists ALL platform transactions with user join, rich filters, sorting, and total count.
     */
    adminListTransactions: async (filterOptions = {}) => {
        const {
            search, type, currency, status,
            date_from, date_to, amount_min, amount_max,
            sort_by = 'created_at', sort_order = 'DESC',
            limit = 20, offset = 0
        } = filterOptions;

        const conditions = [];
        const values = [];
        let idx = 1;

        if (search) {
            conditions.push(`(
                t.id::text ILIKE $${idx}
                OR t.tx_hash ILIKE $${idx}
                OR u.email ILIKE $${idx}
                OR u.username ILIKE $${idx}
                OR t.currency ILIKE $${idx}
            )`);
            values.push(`%${search}%`);
            idx++;
        }
        if (type) {
            conditions.push(`t.type = $${idx++}`);
            values.push(type);
        }
        if (currency) {
            conditions.push(`t.currency = $${idx++}`);
            values.push(currency);
        }
        if (status) {
            conditions.push(`t.status = $${idx++}`);
            values.push(status);
        }
        if (date_from) {
            conditions.push(`t.created_at >= $${idx++}`);
            values.push(date_from);
        }
        if (date_to) {
            conditions.push(`t.created_at <= $${idx++}`);
            values.push(date_to);
        }
        if (amount_min !== undefined && amount_min !== '') {
            conditions.push(`t.amount >= $${idx++}`);
            values.push(parseFloat(amount_min));
        }
        if (amount_max !== undefined && amount_max !== '') {
            conditions.push(`t.amount <= $${idx++}`);
            values.push(parseFloat(amount_max));
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const allowedSortCols = ['created_at', 'amount', 'fee', 'currency', 'type', 'status'];
        const safeSort = allowedSortCols.includes(sort_by) ? `t.${sort_by}` : 't.created_at';
        const safeOrder = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        const countSql = `
            SELECT COUNT(*) FROM transactions t
            LEFT JOIN users u ON u.id = t.user_id
            ${whereClause};
        `;
        const countResult = await query(countSql, values);
        const total = parseInt(countResult.rows[0].count, 10);

        values.push(limit, offset);
        const listSql = `
            SELECT
                t.*,
                u.email   AS user_email,
                u.username AS user_username
            FROM transactions t
            LEFT JOIN users u ON u.id = t.user_id
            ${whereClause}
            ORDER BY ${safeSort} ${safeOrder}
            LIMIT $${idx++} OFFSET $${idx};
        `;

        const result = await query(listSql, values);
        return { rows: result.rows, total };
    },

    /**
     * Admin: get a single transaction by ID with user info (no ownership check).
     */
    adminGetTransactionById: async (transactionId) => {
        if (!transactionId) throw new AppError('Transaction ID is required.', 400);
        const sql = `
            SELECT
                t.*,
                u.email    AS user_email,
                u.username AS user_username
            FROM transactions t
            LEFT JOIN users u ON u.id = t.user_id
            WHERE t.id = $1
            LIMIT 1;
        `;
        const result = await query(sql, [transactionId]);
        return result.rows[0] || null;
    },

    /**
     * Prevents administrative trace deletions from critical financial books.
     */
    deleteTransaction: async (transactionId) => {
        throw new AppError('Hard deletion vectors on critical transactional financial chains are permanently prohibited.', 405);
    }
};

export default transactionService;