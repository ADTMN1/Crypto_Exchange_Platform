import express from "express";
import transactionController from "../controllers/transaction.controller.js";
import { authenticateToken, requireAdmin } from "../middleware/auth.midlware.js";

const transactionRouter = express.Router();

transactionRouter.use(authenticateToken);
transactionRouter.use(requireAdmin);

// Admin: list all transactions with full filters, user join, pagination + total
transactionRouter.get("/transactions", transactionController.adminGetTransactions);

// Admin: get single transaction by ID (no ownership check)
transactionRouter.get("/transactions/:id", transactionController.adminGetTransactionById);

// Admin: update transaction status/hash/confirmations
transactionRouter.patch("/transactions/:id", transactionController.updateTransaction);

export default transactionRouter;
