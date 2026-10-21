import pg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pg;

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const connectionString = process.env.DATABASE_URL;
console.log(`🔗 Database Connection String: ${connectionString ? '[REDACTED]' : 'Not set'}`);
if (!connectionString) {
	console.error('❌ CRITICAL ERROR: DATABASE_URL environment variable is missing.');
	process.exit(1);
}

// Statement timeout (ms) — aborts long-running queries so they cannot hang the app.
// Configurable via DATABASE_STATEMENT_TIMEOUT; defaults to 30s.
const statementTimeout = parseInt(process.env.DATABASE_STATEMENT_TIMEOUT || '30000', 10);

// Supabase connection pooler requires SSL. `rejectUnauthorized: false` is used
// because the Supabase pooler certificate chain is not always present in the
// runtime's CA store. The connection itself is still encrypted.
const pool = new Pool({
	connectionString,
	ssl: isProduction ? { rejectUnauthorized: false } : false,
	max: isProduction ? 20 : 5,
	idleTimeoutMillis: 30000,
	connectionTimeoutMillis: 15000,
	options: `-c statement_timeout=${Number.isFinite(statementTimeout) ? statementTimeout : 30000}`,
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
			// console.log(`⚡ Executed Query: [${text.substring(0, 50)}...] in ${duration}ms | Rows: ${res.rowCount}`);
		}

		return res;
	} catch (error) {
		console.error(`❌ Database Query Execution Failure: ${error.message}`);
		throw error;
	}
};

// Export pool as both default and named export for compatibility
export { pool };
export default pool;
