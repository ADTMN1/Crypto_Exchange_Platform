import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import app from './app.js';
import { query } from './src/config/db.config.js'; 

const PORT = process.env.PORT || 3000;


async function startServer() {
	try {
		console.log('🔄 Verifying database infrastructure availability...');
		
		await query('SELECT 1');
		console.log('✅ Database synchronization verified successfully.');

		const server = app.listen(PORT, () => {
			console.log(`🚀 Production runtime active on port [${PORT}] under [${process.env.NODE_ENV || 'development'}] mode.`);
		});

		// --- Graceful Teardown Sequences ---
		const initiateShutdown = (signal) => {
			console.log(`\n🚨 Received ${signal}. Stopping server connections smoothly...`);
			
			server.close(() => {
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