import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import pool from './src/config/db.config.js';

// Resolve environmental config (same as seed scripts)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

// Exact path to 018 migration
const migrationPath = path.join(__dirname, 'src', 'models', 'migrations', '018_duration_based_payouts.sql');

async function run018Migration() {
  console.log('🚀 Running ONLY 018_duration_based_payouts.sql...');
  
  try {
    const sql = fs.readFileSync(migrationPath, 'utf8');
    console.log('✅ Migration file found and loaded');
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('COMMIT');
      console.log('🎉 018 Migration SUCCESS! Duration-based payouts are now available!');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
      await pool.end();
    }
    process.exit(0);
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

run018Migration();
