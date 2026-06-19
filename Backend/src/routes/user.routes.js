import express from 'express';
import userController from '../controllers/user.controller.js';
import upload from '../config/multer.config.js';
import { authMiddleware, requireAdmin,authenticateToken } from '../middleware/auth.midlware.js';

const adminRouter = express.Router();

// All routes require authentication
adminRouter.use(authenticateToken);

// ─── PROFILE (own user) ────────────────────────────────────────────────────
adminRouter.get('/profile',                                  userController.getProfile);
adminRouter.put('/profile',                                  userController.updateProfile);
adminRouter.put('/profile/password',                         userController.changePassword);
adminRouter.post('/profile/image', upload.single('profileImage'), userController.uploadProfileImage);
adminRouter.delete('/profile/image',                         userController.deleteProfileImage);
adminRouter.post('/profile/verify-email',                    userController.verifyEmail);
adminRouter.delete('/profile',                               userController.deleteAccount);

// ─── ADMIN: USER MANAGEMENT ───────────────────────────────────────────────
adminRouter.get('/users',                requireAdmin,  userController.getAllUsers);
adminRouter.get('/users/active',                requireAdmin,  userController.getActiveUsers);
adminRouter.get('/users/banned',                requireAdmin,  userController.getBannedUsers);
adminRouter.get('/users/:userId',                requireAdmin,  userController.getUserById);
adminRouter.get('/users/:userId/transactions',    requireAdmin,  userController.getUserTransactions);
adminRouter.get('/users/:userId/wallets',         requireAdmin,  userController.getUserWallets);
adminRouter.post('/users/:userId/impersonate',    requireAdmin,  userController.impersonateUser);
adminRouter.patch('/users/:userId/status',          requireAdmin,  userController.setUserStatus);
adminRouter.patch('/users/:userId/ban',           requireAdmin,  userController.banUser);
adminRouter.patch('/users/:userId/unban',          requireAdmin,  userController.unbanUser);
adminRouter.delete('/users/:userId',              requireAdmin,  userController.adminDeleteUser);

export default adminRouter;
