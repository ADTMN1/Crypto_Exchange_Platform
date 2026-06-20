import authService from '../services/auth.service.js';
import AppError from '../utils/errorHandling.js';
import auditController from './audit.controller.js';
import { generateToken, refreshToken } from '../utils/generateToken.js';
import { cookieOptions } from '../utils/cookiesOption.js';
import { OAuth2Client } from 'google-auth-library';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const AuthController = {
    /**
     * Send OTP to email for registration
     */
    sendOTP: async (req, res, next) => {
        const { email } = req.body;
        if (!email) {
            throw new AppError('Email is required', 400);
        }
        try {
            const result = await authService.sendOTP(email);
            res.status(200).json({
                success: true,
                message: result.message
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * Verify OTP
     */
    verifyOTP: async (req, res, next) => {
        const { email, otp } = req.body;
        if (!email || !otp) {
            throw new AppError('Email and OTP are required', 400);
        }
        try {
            const result = await authService.verifyOTP(email, otp);
            res.status(200).json({
                success: true,
                message: result.message
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * Controller bridge managing user registration routing signatures.
     */
    register: async (req, res, next) => {
        const { email, username, phone_number, password, otp } = req.body;
        // Don't allow role_id from request body for security - always use 'user' role
        if(!email || !username || !password || !phone_number || !otp) {
           throw new AppError('Missing required fields', 400);

        }
// console.log('Received registration request:', { email, username, phone_number }); // Debug log
        try {
            const newUser = await authService.register(email, username, phone_number, password, otp);
            if (!newUser) {
                throw new AppError('Registration failed. Please try again.', 400);
            }
            
            res.status(201).json({
                success: true,
                message: 'User registered successfully.',
                data: newUser
            });
            auditController.auditingSave(req, 'User registered', 'user', newUser.id, { email: newUser.email, username: newUser.username }, newUser.id)
                .catch((err) => console.error('Audit save failed:', err));
            return;
        } catch (error) {
            next(error); // Bubbles error up to central error handling middleware in app.js
        }
    },

    /**
     * Controller bridge processing verification request streams.
     */
    login: async (req, res, next) => {
        const { email, password } = req.body; // 'username' can handle emails via flexible query mapping
if(!email || !password) {
           throw new AppError('Email and password are required', 400);
        }
        try {
            const userMetadata = await authService.login(email, password);
// console.log('User metadata after successful login:', userMetadata); // Debug log
      // ✅ Generate token HERE
      const accessToken = await generateToken(userMetadata.id, userMetadata.email, userMetadata.role);
       const refre_shToken = await refreshToken(userMetadata.id, userMetadata.email, userMetadata.role);

      // ✅ Set cookie using centralized cookieOptions
   res.cookie("token" ,accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
   res.cookie("refreshToken", refre_shToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });


            res.status(200).json({
                success: true,
                message: 'Login successful.',
                user: userMetadata,
                accessToken,
                refreshToken: refre_shToken
            });
            auditController.auditingSave(req, 'User login', 'user', userMetadata.id, { email: userMetadata.email }, userMetadata.id)
                .catch((err) => console.error('Audit save failed:', err));
            return;
        } catch (error) {
            next(error);
        }
    },

    /**
     * Google OAuth login handler - Industry standard implementation
     * Security features:
     * - Email-based account unification
     * - Automatic OAuth provider linking
     * - Audit logging for compliance
     */
    googleLogin: async (req, res, next) => {
        const { token } = req.body;

        try {
            // 1. Verify the Google token
            const ticket = await googleClient.verifyIdToken({
                idToken: token,
                audience: process.env.GOOGLE_CLIENT_ID,
            });

            const payload = ticket.getPayload();
            const { email, name, sub: googleId, picture, email_verified } = payload;

            // 2. Security check: Require verified email from Google
            if (!email_verified) {
                const error = new Error('Google account email is not verified. Please verify your email with Google first.');
                error.statusCode = 403;
                throw error;
            }

            // 3. Login or register user (with automatic account linking)
            const userMetadata = await authService.googleLogin(email, name, googleId, picture);

            // 4. Generate tokens
            const accessToken = await generateToken(userMetadata.id, userMetadata.email, userMetadata.role);
            const refre_shToken = await refreshToken(userMetadata.id, userMetadata.email, userMetadata.role);

            // 5. Set cookies using centralized cookieOptions
            res.cookie("token", accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
            res.cookie("refreshToken", refre_shToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

            res.status(200).json({
                success: true,
                message: 'Google login successful.',
                user: userMetadata,
                accessToken,
                refreshToken: refre_shToken
            });
            auditController.auditingSave(req, 'Google OAuth login', 'user', userMetadata.id, { provider: 'google', email: userMetadata.email }, userMetadata.id)
                .catch((err) => console.error('Audit save failed:', err));
            return;
        } catch (error) {
            console.error('Google login error:', error);
            next(error);
        }
    },

    /**
     * Controller bridge triggering system teardowns for session states.
     */
    logout: async (req, res, next) => {
        try {
            const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

            await authService.logout(refreshToken);

            // Clear active cookie maps from user agents
            res.clearCookie('token');
            res.clearCookie('refreshToken', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
            });

            res.status(200).json({
                success: true,
                message: 'Logged out successfully.'
            });
            auditController.auditingSave(req, 'User logout', 'session', req.user?.id || null)
                .catch((err) => console.error('Audit save failed:', err));
            return;
        } catch (error) {
            next(error);
        }
    },

    /**
     * Refresh access token using refresh token
     * Enterprise-grade token refresh mechanism
     */
    refreshToken: async (req, res, next) => {
        try {
            const refToken = req.cookies?.refreshToken || req.body.refreshToken;

            if (!refToken) {
                const error = new Error('Refresh token required');
                error.statusCode = 401;
                throw error;
            }

            // Verify refresh token
            const jwt = await import('jsonwebtoken');
            const decoded = jwt.default.verify(refToken, process.env.REFRESH_SECRET);

            // Generate new access token
            const newAccessToken = await generateToken(decoded.id, decoded.email, decoded.role);

            // Set new access token cookie using centralized cookieOptions
            res.cookie("token", newAccessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });

            res.status(200).json({
                success: true,
                message: 'Token refreshed successfully',
                accessToken: newAccessToken
            });
            auditController.auditingSave(req, 'Access token refreshed', 'session', decoded?.id || null, { email: decoded?.email }, decoded?.id || null)
                .catch((err) => console.error('Audit save failed:', err));
            return;
        } catch (error) {
            console.error('Token refresh error:', error);
            if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
                return res.status(403).json({
                    success: false,
                    message: 'Invalid or expired refresh token. Please login again.'
                });
            }
            next(error);
        }
    },

    /**
     * Send password reset email
     */
    forgotPassword: async (req, res, next) => {
        const { email } = req.body;
        if (!email) {
            throw new AppError('Email is required', 400);
        }
        try {
            const result = await authService.forgotPassword(email);
            res.status(200).json({
                success: true,
                message: result.message
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * Reset password
     */
    resetPassword: async (req, res, next) => {
        const { token, password } = req.body;
        if (!token || !password) {
            throw new AppError('Token and new password are required', 400);
        }
        try {
            const result = await authService.resetPassword(token, password);
            res.status(200).json({
                success: true,
                message: result.message
            });
        } catch (error) {
            next(error);
        }
    }
};

export default AuthController;