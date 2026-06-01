import { Pool, neonConfig } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import ws from 'ws';

dotenv.config();
// Neon configuration for WebSocket usage
neonConfig.webSocketConstructor = ws;

const isProduction = process.env.NODE_ENV === 'production';
const connectionString = process.env.DATABASE_URL;
console.log(`🔗 Database Connection String: ${connectionString ? '[REDACTED]' : 'Not set'}`);
if (!connectionString) {
	console.error('❌ CRITICAL ERROR: DATABASE_URL environment variable is missing.');
	process.exit(1);
}

const pool = new Pool({ 
	connectionString,
	ssl: isProduction ? { rejectUnauthorized: true } : false,
	max: isProduction ? 20 : 5,      
	idleTimeoutMillis: 30000,        
	connectionTimeoutMillis: 2000,   
});

pool.on('error', (err) => {
	console.error('❌ UNEXPECTED ERROR ON IDLE POSTGRES CLIENT:', err.stack || err.message);
});

export const query = async (text, params) => {
	const start = Date.now();
	try {
		const res = await pool.query(text, params);
		const duration = Date.now() - start;
		
		if (!isProduction) {
			console.log(`⚡ Executed Query: [${text.substring(0, 50)}...] in ${duration}ms | Rows: ${res.rowCount}`);
		}
		
		return res;
	} catch (error) {
		console.error(`❌ Database Query Execution Failure: ${error.message}`);
		throw error; 
	}
};

export default pool;