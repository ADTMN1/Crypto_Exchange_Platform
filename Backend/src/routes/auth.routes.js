import express from 'express';
import AuthController from '../controllers/auth.controller.js';
import authValidator from '../validators/auth.validator.js';

const authRouter = express.Router();

// Authentication Routes
authRouter.post('/register', AuthController.register);
authRouter.post('/login',
	authValidator.validateLogin, AuthController.login);
	
authRouter.post('/google', AuthController.googleLogin);
authRouter.post('/logout', AuthController.logout);

export default authRouter;