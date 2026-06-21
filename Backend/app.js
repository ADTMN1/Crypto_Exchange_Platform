import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { doubleCsrf } from 'csrf-csrf';
import router from './src/routes/route.index.js';
import dotenv from 'dotenv';
import globalErrorHandler from './src/middleware/errorMiddleware.js';
import AppError from './src/utils/errorHandling.js';
dotenv.config();
const app = express();

// Log all incoming requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  // console.log('Request headers:', req.headers);
  next();
});

// 1. Production Security Headers & Footprint Obscurity
app.use(helmet());
app.disable('x-powered-by');
app.set('trust proxy', 1);

// 2. Performance Optimization
app.use(compression()); 

// 3. Cookie Parsing (MUST be before CSRF setup)
app.use(cookieParser(process.env.COOKIE_SECRET));

// 4. Data Parsers & Strict Sizing Thresholds (MUST be before CSRF setup)
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 5. Cross-Origin Resource Sharing (Production Sanitized)
app.use(
	cors({
		origin: (origin, callback) => {
			const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [];
  if (!origin) return callback(null, true); // allow server-to-server

			if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
				callback(null, true);
			} else {
				callback(new Error('Blocked by Cross-Origin Resource Sharing policy'));
			}
		},
		methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
		credentials: true,
	})
);

// 6. DDoS & API Abuse Protection
const apiLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100, 
	standardHeaders: true, 
	legacyHeaders: false, 
	message: { error: 'Too many requests from this network. Please try again later.' },
});
app.use('/api', apiLimiter);

// 7. HTTP Traffic Auditing
if (process.env.NODE_ENV !== 'production') {
	app.use(morgan('dev'));
} else {
	app.use(morgan('combined')); 
}

// 8. CSRF Protection Setup (AFTER cookie-parser and body parsers)
const {
  invalidCsrfTokenError,
  generateCsrfToken,  // CORRECT NAME
  validateRequest,
  doubleCsrfProtection,
} = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET || 'fallback-secret-change-in-production',
  cookieName: 'x-csrf-token',
  cookieOptions: {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: process.env.NODE_ENV === "production",
    path: '/',
  },
  size: 64,
  getTokenFromRequest: (req) => req.headers['x-csrf-token'],
  getSessionIdentifier: (req) => req.ip || 'anonymous',  // Required by csrf-csrf v4
});

// 9. Infrastructure Health Checks & Base Route
app.get('/health', (req, res) => {
	res.status(200).json({
		status: 'healthy',
		timestamp: new Date().toISOString(),
		uptime: process.uptime(),
	});
});

// 10. Endpoint to get CSRF token (MUST be before CSRF protection middleware)
app.get('/api/csrf-token', (req, res) => {
  const csrfToken = generateCsrfToken(req, res);
  res.json({ csrfToken });
});

// 11. Apply CSRF protection to state-changing routes (AFTER token endpoint)
app.use('/api', (req, res, next) => {
  // Skip CSRF for GET, HEAD, OPTIONS, and csrf-token endpoint
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method) || req.path === '/csrf-token') {
    return next();
  }
  doubleCsrfProtection(req, res, next);
});

app.use('/api',router)

app.get('/api', (req, res) => {
	res.json({ message: 'Crypto Exchange Tier-1 Backend Running Securely.' });
});

app.get('/', (req, res) => {
  res.status(200).json({ status: 'success', message: 'Backend is up and running!' });
});

// 2. Fallback Route for non-existent URLs (404 Not Found)
app.use((req, res, next) => {
  const err = new AppError(`Can't find ${req.originalUrl} on this server!`, 404);
  next(err);
});

// 3. THE GLOBAL ERROR HANDLER (Must be last!)
app.use(globalErrorHandler);



export default app;
