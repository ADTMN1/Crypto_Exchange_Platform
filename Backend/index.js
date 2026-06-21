import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { createServer } from 'http';
import app from './app.js';
import { query } from './src/config/db.config.js';
import redisClient from './src/config/redis.config.js';
import { initializeWebSocket } from './src/websocket/socket.js';
import { startBinaryTradeResolver, stopBinaryTradeResolver } from './src/jobs/tradeResolver.js';

const PORT = process.env.PORT || 3000;

async function startServer() {
	try {
		console.log('🔄 Verifying database infrastructure availability...');

		await query('SELECT 1');
		console.log('✅ Database synchronization verified successfully.');

		console.log('🔄 Connecting to Redis...');
		await redisClient.ping();
		console.log('✅ Redis connection established successfully.');

		startBinaryTradeResolver();

		// Wrap Express app in an HTTP server so Socket.IO can share the same port
		const httpServer = createServer(app);

		// Initialize WebSocket with enhanced trading features
		const io = initializeWebSocket(httpServer);

		// Robust listen: handle EADDRINUSE and optionally retry on next ports
		const startingPort = Number(PORT);
		const maxRetries = Number(process.env.PORT_RETRY_COUNT) || 5;

		const tryListen = (server, port, remainingRetries) => {
			server.once('error', (err) => {
				if (err && err.code === 'EADDRINUSE') {
					console.error(`❌ Port ${port} is already in use.`);
					if (remainingRetries > 0) {
						const nextPort = port + 1;
						console.log(`🔁 Attempting to bind to port ${nextPort} (${remainingRetries} retries left)...`);
						// try next port
						tryListen(server, nextPort, remainingRetries - 1);
						server.listen(nextPort);
					} else {
						console.error('❌ No available ports found after retries. Exiting.');
						process.exit(1);
					}
				} else {
					console.error('❌ Server error during bind:', err);
					process.exit(1);
				}
			});

			server.once('listening', () => {
				console.log(`🚀 Production runtime active on port [${port}] under [${process.env.NODE_ENV || 'development'}] mode.`);
				// cleanup transient listeners
				server.removeAllListeners('error');
			});

			server.listen(port);
		};

		tryListen(httpServer, startingPort, maxRetries);

		// --- Graceful Teardown Sequences ---
		const initiateShutdown = (signal) => {
			console.log(`\n🚨 Received ${signal}. Stopping server connections smoothly...`);

			httpServer.close(() => {
				stopBinaryTradeResolver();
				console.log('🛑 Active HTTP connections drained. Infrastructure closed safely.');
				process.exit(0);
			});

			setTimeout(() => {
				console.error('⚠️ Connections failed to close in time. Forcing application termination.');
				process.exit(1);
			}, 30000);
		};

		process.on('SIGINT', () => initiateShutdown('SIGINT'));
		process.on('SIGTERM', () => initiateShutdown('SIGTERM'));

	} catch (error) {
		console.error('❌ CRITICAL BOOTSTRAP FAILURE: Could not establish connection to the database.');
		console.error(error.message);
		process.exit(1);
	}
}

process.on('unhandledRejection', (reason) => {
	console.error(`❌ CRITICAL UNHANDLED REJECTION: ${reason.stack || reason.message}`);
	process.exit(1);
});

process.on('uncaughtException', (error) => {
	console.error(`❌ CRITICAL UNCAUGHT EXCEPTION: ${error.stack || error.message}`);
	process.exit(1);
});

startServer();
