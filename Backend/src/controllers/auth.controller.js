import authService from '../services/auth.service.js';
import { generateToken, refreshToken } from '../utils/generateToken.js';

const AuthController = {
    /**
     * Controller bridge managing user registration routing signatures.
     */
    register: async (req, res, next) => {
        const { email, username, phone_number, password, role_id } = req.body;

        try {
            const newUser = await authService.register(email, username, phone_number, password, role_id);
            
            return res.status(201).json({
                success: true,
                message: 'User registered successfully.',
                data: newUser
            });
        } catch (error) {
            next(error); // Bubbles error up to central error handling middleware in app.js
        }
    },

    /**
     * Controller bridge processing verification request streams.
     */
    login: async (req, res, next) => {
        const { email, password } = req.body; // 'username' can handle emails via flexible query mapping

        try {
            const userMetadata = await authService.login(email, password);

      // ✅ Generate token HERE
      const accessToken = await generateToken(userMetadata.id, userMetadata.email, userMetadata.username);
       const refre_shToken = await refreshToken(userMetadata.id, userMetadata.email, userMetadata.username);


       

     const cookieOptions = {
  httpOnly: true,
  // MUST be true for sameSite: "none" to work
  secure: true, 
  // "none" allows the cookie to be sent across different Render subdomains
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", 
};
      // ✅ Set cookie
   res.cookie("token" ,accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
   res.cookie("refreshToken", refre_shToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });


            return res.status(200).json({
                success: true,
                message: 'Login successful.',
                user: userMetadata

            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * Controller bridge triggering system teardowns for session states.
     */
    logout: async (req, res, next) => {
        try {
            const refreshToken = req.cookies?.refresh_token || req.body.refresh_token;

            await authService.logout(refreshToken);

            // Clear active cookie maps from user agents
            res.clearCookie('refresh_token', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict'
            });

            return res.status(200).json({
                success: true,
                message: 'Logged out successfully.'
            });
        } catch (error) {
            next(error);
        }
    }
};

export default AuthController;