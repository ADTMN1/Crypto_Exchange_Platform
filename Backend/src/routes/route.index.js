import express from 'express';
import authRouter from './auth.routes.js';
import userRouter from './user.routes.js';
import adminRouter from './user.routes.js';
import historyRouter from './history.routes.js';
import supportRouter from './support.routes.js';
import auditRouter from './audit.routes.js';
import marketRouter from './market.routes.js';
import notificationRouter from './notification.routes.js';

const router = express.Router();
router.use('/auth',          authRouter);
router.use('/user',          userRouter);
router.use('/history',       historyRouter);
router.use('/support',       supportRouter);
router.use('/audit',         auditRouter);
router.use('/market',        marketRouter);
router.use('/admin',         adminRouter);
router.use('/admin',         auditRouter);
router.use('/notifications', notificationRouter);

export default router;