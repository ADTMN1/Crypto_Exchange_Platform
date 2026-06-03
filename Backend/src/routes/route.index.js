import express from 'express';
import authRouter from './auth.routes.js';
import userRouter from './user.routes.js';
import historyRouter from './history.routes.js';
import supportRouter from './support.routes.js';
import adminRouter from './user.routes.js';

const router = express.Router();
router.use('/auth', authRouter);
router.use('/user', userRouter);
router.use('/history', historyRouter);
router.use('/support', supportRouter);
router.use('/admin', adminRouter); // Admin routes are included in adminRouter with requireAdmin middleware

export default router;