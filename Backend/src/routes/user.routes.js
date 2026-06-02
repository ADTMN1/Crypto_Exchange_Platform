import express from 'express';
import userController from '../controllers/user.controller.js';
import upload from '../config/multer.config.js';
import { authenticateToken } from '../middleware/auth.midlware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get user profile
router.get('/profile', userController.getProfile);

// Update user profile
router.put('/profile/update', userController.updateProfile);

// Upload profile image
router.post('/profile/image', upload.single('profileImage'), userController.uploadProfileImage);

// Delete profile image
router.delete('/profile/image', userController.deleteProfileImage);

export default router;
