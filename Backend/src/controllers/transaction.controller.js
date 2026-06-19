import transactionService from "../services/transaction.service.js";
import AppError from "../utils/errorHandling.js";

const transactionController = {
    /**
     * Creates a new financial ledger transaction trace.
     */
    createTransaction: async (req, res, next) => {
        try {
            const { wallet_id, type, currency, amount, fee, tx_hash, from_address, to_address } = req.body;
            const user_id = req.user?.id; 

            if (!user_id) {
                throw new AppError("Authentication parameters are required to generate a transaction trace.", 401);
            }

            const newTransaction = await transactionService.createTransaction({
                user_id,
                wallet_id,
                type,
                currency,
                amount,
                fee,
                tx_hash,
                from_address,
                to_address
            });

            res.status(201).json({
                success: true,
                message: "Transaction context entry initialized successfully.",
                data: newTransaction
            });
        } catch (error) {
            next(error); 
        }
    },

    /**
     * Admin: lists ALL platform transactions with rich filters, user join, and total count.
     */
    adminGetTransactions: async (req, res, next) => {
        try {
            const {
                search, type, currency, status,
                date_from, date_to, amount_min, amount_max,
                sort_by, sort_order,
                limit, offset, page
            } = req.query;

            const parsedLimit  = limit  ? parseInt(limit,  10) : 20;
            const parsedPage   = page   ? parseInt(page,   10) : 1;
            const parsedOffset = offset ? parseInt(offset, 10) : (parsedPage - 1) * parsedLimit;

            const { rows, total } = await transactionService.adminListTransactions({
                search, type, currency, status,
                date_from, date_to, amount_min, amount_max,
                sort_by, sort_order,
                limit: parsedLimit,
                offset: parsedOffset
            });

            res.status(200).json({
                success: true,
                data: {
                    transactions: rows,
                    total,
                    page: parsedPage,
                    limit: parsedLimit
                }
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * Admin: get single transaction by ID with user info (no ownership check).
     */
    adminGetTransactionById: async (req, res, next) => {
        try {
            const { id } = req.params;
            const transaction = await transactionService.adminGetTransactionById(id);

            if (!transaction) {
                throw new AppError('Transaction not found.', 404);
            }

            res.status(200).json({ success: true, data: transaction });
        } catch (error) {
            next(error);
        }
    },

    /**
     * Resolves unique entry identity values down to clear detailed record blocks.
     */
    getTransactionById: async (req, res, next) => {
        try {
            const { id } = req.params;
            const currentUserId = req.user?.id;

            const transaction = await transactionService.getTransactionById(id);
            
            if (!transaction) {
                throw new AppError("Requested transaction record could not be found.", 404);
            }

            // Security verification boundary
            if (transaction.user_id !== currentUserId) {
                throw new AppError("Access validation failure on requested ledger properties resource.", 403);
            }

            res.status(200).json({
                success: true,
                data: transaction
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * Modifies specific ongoing mutable transaction metadata (e.g., confirmations, tx_hash).
     */
    updateTransaction: async (req, res, next) => {
        try {
            const { id } = req.params;
            const updateData = req.body; // e.g., { status, tx_hash, confirmations }

            const updatedTransaction = await transactionService.updateTransaction(id, updateData);

            res.status(200).json({
                success: true,
                message: "Transaction history row modified successfully.",
                data: updatedTransaction
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * Lists ledger transaction chains with multi-conditional query filters.
     */
    getTransactions: async (req, res, next) => {
        try {
            const user_id = req.user?.id;
            const { type, currency, status, limit, offset } = req.query;

            if (!user_id) {
                throw new AppError("Unauthorized entry attempt profile parameters missing.", 401);
            }

            const transactions = await transactionService.listTransactions({
                user_id,
                type,
                currency,
                status,
                limit: limit ? parseInt(limit, 10) : 20,
                offset: offset ? parseInt(offset, 10) : 0
            });

            res.status(200).json({
                success: true,
                count: transactions.length,
                data: transactions
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * Deletes a transaction trace (Calls the block layer which systematically rejects hard deletions).
     */
    deleteTransaction: async (req, res, next) => {
        try {
            const { id } = req.params;
            await transactionService.deleteTransaction(id);
            
            res.status(200).json({
                success: true,
                message: "Transaction erased successfully."
            });
        } catch (error) {
            next(error);
        }
    }
};

export default transactionController;