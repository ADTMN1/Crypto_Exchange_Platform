import userService from '../services/user.sevice.js';
import AppError from '../utils/errorHandling.js';
import auditController from './audit.controller.js';

const userController = {

  // ─── PROFILE ────────────────────────────────────────────────────────────────

  getProfile: async (req, res, next) => {
    try {

if(!req.user || !req.user.id) {
  return next(new AppError('Authenticated user information is missing', 401));
}

      const user = await userService.getProfile(req.user.id);
      if (!user) {
        return next(new AppError('User not found', 404));
      }
      res.status(200).json({ success: true, data: user });
      auditController.auditingSave(req, 'Viewed profile', 'user', req.user.id)
          .catch((err) => console.error('Audit save failed:', err));
      return;
    } catch (error) {
      next(error);
    }
  },

  updateProfile: async (req, res, next) => {
    try {
      const { username, email, phone_number } = req.body;
      if (!username && !email && !phone_number) {
        return next(new AppError('At least one field (username, email, or phone_number) must be provided for update', 400));
      }
      const updated = await userService.updateProfile(req.user.id, { username, email, phone_number });

      res.status(200).json({ success: true, message: 'Profile updated successfully.', data: updated });
      auditController.auditingSave(req, 'Updated profile', 'user', req.user.id, { updatedFields: { username, email, phone_number } })
          .catch((err) => console.error('Audit save failed:', err));
      return;
    } catch (error) {
      next(error);
    }
  },

  changePassword: async (req, res, next) => {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return next(new AppError('currentPassword and newPassword are required', 400));
      }
      await userService.changePassword(req.user.id, currentPassword, newPassword);
      res.status(200).json({ success: true, message: 'Password changed successfully.' });
      auditController.auditingSave(req, 'Changed password', 'user', req.user.id)
          .catch((err) => console.error('Audit save failed:', err));
      return;
    } catch (error) {
      next(error);
    }
  },

  // ─── PROFILE IMAGE ──────────────────────────────────────────────────────────

  uploadProfileImage: async (req, res, next) => {
    try {
      if (!req.file) return next(new AppError('No image file provided', 400));
      const result = await userService.uploadProfileImage(req.user.id, req.file.buffer);
      res.status(200).json({ success: true, message: 'Profile image uploaded successfully.', data: result });
      auditController.auditingSave(req, 'Uploaded profile image', 'user', req.user.id)
          .catch((err) => console.error('Audit save failed:', err));
      return;
    } catch (error) {
      next(error);
    }
  },

  deleteProfileImage: async (req, res, next) => {
    try {
      await userService.deleteProfileImage(req.user.id);
      res.status(200).json({ success: true, message: 'Profile image deleted successfully.' });
      auditController.auditingSave(req, 'Deleted profile image', 'user', req.user.id)
          .catch((err) => console.error('Audit save failed:', err));
      return;
    } catch (error) {
      next(error);
    }
  },

  // ─── EMAIL VERIFICATION ─────────────────────────────────────────────────────

  verifyEmail: async (req, res, next) => {
    try {
      // In production: decode a signed email verification token here
      // For now: verify the currently authenticated user's email
      const result = await userService.verifyEmail(req.user.id);
      res.status(200).json({ success: true, message: 'Email verified successfully.', data: result });
      auditController.auditingSave(req, 'Verified email', 'user', req.user.id)
          .catch((err) => console.error('Audit save failed:', err));
      return;
    } catch (error) {
      next(error);
    }
  },

  // ─── ACCOUNT SELF-DELETION ──────────────────────────────────────────────────

  deleteAccount: async (req, res, next) => {
    try {
      await userService.deleteAccount(req.user.id);
      res.clearCookie('token');
      res.clearCookie('refreshToken');
      res.status(200).json({ success: true, message: 'Account deleted successfully.' });
      auditController.auditingSave(req, 'Deleted account', 'user', req.user.id)
          .catch((err) => console.error('Audit save failed:', err));
      return;
    } catch (error) {
      next(error);
    }
  },

  // ─── ADMIN: USER MANAGEMENT ─────────────────────────────────────────────────

  getAllUsers: async (req, res, next) => {
    try {
      const { page, limit, status, search } = req.query;
      const result = await userService.getAllUsers({
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        status,
        search,
      });
      res.status(200).json({ success: true, data: result });
      auditController.auditingSave(req, 'Viewed all users', 'admin_user_management', null, { page: parseInt(page) || 1, limit: parseInt(limit) || 20, status, search })
          .catch((err) => console.error('Audit save failed:', err));
      return;
    } catch (error) {
      next(error);
    }
  },

  getActiveUsers: async (req, res, next) => {
    try {
      const { page, limit } = req.query;
      const result = await userService.getActiveUsers(parseInt(page) || 1, parseInt(limit) || 20);
      res.status(200).json({ success: true, data: result });
      auditController.auditingSave(req, 'Viewed active users', 'admin_user_management', null, { page: parseInt(page) || 1, limit: parseInt(limit) || 20 })
          .catch((err) => console.error('Audit save failed:', err));
      return;
    } catch (error) {
      next(error);
    }
  },

  getBannedUsers: async (req, res, next) => {
    try {
      const { page, limit } = req.query;
      const result = await userService.getBannedUsers(parseInt(page) || 1, parseInt(limit) || 20);
      res.status(200).json({ success: true, data: result });
      auditController.auditingSave(req, 'Viewed banned users', 'admin_user_management', null, { page: parseInt(page) || 1, limit: parseInt(limit) || 20 })
          .catch((err) => console.error('Audit save failed:', err));
      return;
    } catch (error) {
      next(error);
    }
  },

  getUserById: async (req, res, next) => {
    try {
      const user = await userService.getUserById(req.params.userId);
      res.status(200).json({ success: true, data: user });
      auditController.auditingSave(req, 'Viewed user details', 'admin_user_management', req.params.userId)
          .catch((err) => console.error('Audit save failed:', err));
      return;
    } catch (error) {
      next(error);
    }
  },

  banUser: async (req, res, next) => {
    try {
      await userService.banUser(req.params.userId);
      res.status(200).json({ success: true, message: 'User banned successfully.' });
      auditController.auditingSave(req, 'Banned user', 'admin_user_management', req.params.userId)
          .catch((err) => console.error('Audit save failed:', err));
      return;
    } catch (error) {
      next(error);
    }
  },

  unbanUser: async (req, res, next) => {
    try {
      await userService.unbanUser(req.params.userId);
      res.status(200).json({ success: true, message: 'User unbanned successfully.' });
      auditController.auditingSave(req, 'Unbanned user', 'admin_user_management', req.params.userId)
          .catch((err) => console.error('Audit save failed:', err));
      return;
    } catch (error) {
      next(error);
    }
  },

  setUserStatus: async (req, res, next) => {
    try {
      const { status } = req.body;
      if (!status) return next(new AppError('status is required', 400));
      await userService.setUserStatus(req.params.userId, status);
      res.status(200).json({ success: true, message: `User status updated to '${status}'.` });
      auditController.auditingSave(req, 'Updated user status', 'admin_user_management', req.params.userId, { status })
          .catch((err) => console.error('Audit save failed:', err));
      return;
    } catch (error) {
      next(error);
    }
  },

  adminDeleteUser: async (req, res, next) => {
    try {
      await userService.adminDeleteUser(req.params.userId);
      res.status(200).json({ success: true, message: 'User deleted successfully.' });
      auditController.auditingSave(req, 'Deleted user', 'admin_user_management', req.params.userId)
          .catch((err) => console.error('Audit save failed:', err));
      return;
    } catch (error) {
      next(error);
    }
  },

  getUserTransactions: async (req, res, next) => {
    try {
      const { page, limit } = req.query;
      const result = await userService.getUserTransactions(
        req.params.userId,
        parseInt(page) || 1,
        parseInt(limit) || 20
      );
      res.status(200).json({ success: true, data: result });
      auditController.auditingSave(req, 'Viewed user transactions', 'admin_user_management', req.params.userId)
          .catch((err) => console.error('Audit save failed:', err));
      return;
    } catch (error) {
      next(error);
    }
  },

  getUserWallets: async (req, res, next) => {
    try {
      const wallets = await userService.getUserWallets(req.params.userId);
      res.status(200).json({ success: true, data: wallets });
      auditController.auditingSave(req, 'Viewed user wallets', 'admin_user_management', req.params.userId)
          .catch((err) => console.error('Audit save failed:', err));
      return;
    } catch (error) {
      next(error);
    }
  },

  impersonateUser: async (req, res, next) => {
    try {
      const { generateToken, refreshToken: genRefreshToken } = await import('../utils/generateToken.js');
      const AppError = (await import('../utils/errorHandling.js')).default;

      // Fetch user to impersonate
      const targetUser = await userService.getUserById(req.params.userId);
      if (!targetUser) return next(new AppError('User not found', 404));
      if (targetUser.account_status === 'banned') {
        return next(new AppError('Cannot impersonate a banned user', 403));
      }

      const impersonationToken = await generateToken(targetUser.id, targetUser.email, targetUser.role || 'user');
      const impersonationRefreshToken = await genRefreshToken(targetUser.id, targetUser.email, targetUser.role || 'user');

      res.status(200).json({
        success: true,
        message: `Impersonation token generated for ${targetUser.username}`,
        data: {
          accessToken: impersonationToken,
          refreshToken: impersonationRefreshToken,
          user: targetUser,
        },
      });

      auditController.auditingSave(
        req, `Admin impersonated user: ${targetUser.username}`,
        'admin_impersonation', targetUser.id,
        { adminId: req.user.id, adminEmail: req.user.email }
      ).catch((err) => console.error('Audit save failed:', err));
      return;
    } catch (error) {
      next(error);
    }
  },
};

export default userController;
