import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import router from './src/routes/route.index.js';
import dotenv from 'dotenv';
dotenv.config();
const app = express();

// 1. Production Security Headers & Footprint Obscurity
app.use(helmet());
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
// 3. Cookie Parsing (Now safely handles signed cookies via initialized secrets)
app.use(cookieParser(process.env.COOKIE_SECRET));

// 4. Cross-Origin Resource Sharing (Production Sanitized)
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

// 2. Performance Optimization
app.use(compression()); 
// 5. DDoS & API Abuse Protection
const apiLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100, 
	standardHeaders: true, 
	legacyHeaders: false, 
	message: { error: 'Too many requests from this network. Please try again later.' },
});
app.use('/api', apiLimiter);
// 6. HTTP Traffic Auditing
if (process.env.NODE_ENV !== 'production') {
	app.use(morgan('dev'));
} else {
	app.use(morgan('combined')); 
}

// 7. Data Parsers & Strict Sizing Thresholds
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 8. Infrastructure Health Checks & Base Route
app.get('/health', (req, res) => {
	res.status(200).json({
		status: 'healthy',
		timestamp: new Date().toISOString(),
		uptime: process.uptime(),
	});
});


app.use('/api',router)

app.get('/api', (req, res) => {
	res.json({ message: 'Crypto Exchange Tier-1 Backend Running Securely.' });
});

app.use((req, res) => {
	res.status(404).json({ error: 'API Not Found' });
});

// 10. Centralized Error Handling Interceptor
app.use((err, req, res, next) => {
	const statusCode = err.status || err.statusCode || 500;

	const responseMessage =
		process.env.NODE_ENV === 'production' && statusCode === 500
			? 'Internal Server Error'
			: err.message;

	console.error(`[System Error Block]: ${err.stack || err.message}`);

	res.status(statusCode).json({
		success: false,
		error: responseMessage || err.message || 'Unknown Error'
	});
});
export default app;