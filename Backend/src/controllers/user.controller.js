import userService from '../services/user.sevice.js';
import AppError from '../utils/errorHandling.js';

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
    } catch (error) {
      next(error);
    }
  },

  deleteProfileImage: async (req, res, next) => {
    try {
      await userService.deleteProfileImage(req.user.id);
      res.status(200).json({ success: true, message: 'Profile image deleted successfully.' });
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
    } catch (error) {
      next(error);
    }
  },

  getActiveUsers: async (req, res, next) => {
    try {
      const { page, limit } = req.query;
      const result = await userService.getActiveUsers(parseInt(page) || 1, parseInt(limit) || 20);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  getBannedUsers: async (req, res, next) => {
    try {
      const { page, limit } = req.query;
      const result = await userService.getBannedUsers(parseInt(page) || 1, parseInt(limit) || 20);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  getUserById: async (req, res, next) => {
    try {
      const user = await userService.getUserById(req.params.userId);
      res.status(200).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  },

  banUser: async (req, res, next) => {
    try {
      await userService.banUser(req.params.userId);
      res.status(200).json({ success: true, message: 'User banned successfully.' });
    } catch (error) {
      next(error);
    }
  },

  unbanUser: async (req, res, next) => {
    try {
      await userService.unbanUser(req.params.userId);
      res.status(200).json({ success: true, message: 'User unbanned successfully.' });
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
    } catch (error) {
      next(error);
    }
  },

  adminDeleteUser: async (req, res, next) => {
    try {
      await userService.adminDeleteUser(req.params.userId);
      res.status(200).json({ success: true, message: 'User deleted successfully.' });
    } catch (error) {
      next(error);
    }
  },
};

export default userController;
