import express from 'express';
import AuthController from '../controllers/auth.controller.js';
import authValidator from '../validators/auth.validator.js';

const authRouter = express.Router();

// Authentication Routes
authRouter.post('/send-otp', AuthController.sendOTP);
authRouter.post('/verify-otp', AuthController.verifyOTP);
authRouter.post('/register', AuthController.register);
authRouter.post('/login',
	authValidator.validateLogin, AuthController.login);
	
authRouter.post('/google', AuthController.googleLogin);
authRouter.post('/refresh-token', AuthController.refreshToken);
authRouter.post('/logout', AuthController.logout);
authRouter.post('/forgot-password', AuthController.forgotPassword);
authRouter.post('/reset-password', AuthController.resetPassword);

export default authRouter;