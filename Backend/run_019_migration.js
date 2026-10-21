import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import pool from './src/config/db.config.js';

// Resolve environmental config (same as seed scripts)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '.env');
dotenv.config({ path: envPath });

// Exact path to 019 migration
const migrationPath = path.join(__dirname, 'src', 'models', 'migrations', '019_create_chat_support_tables.sql');

async function run019Migration() {
  console.log('🚀 Running 019_create_chat_support_tables.sql...');
  
  try {
    const sql = fs.readFileSync(migrationPath, 'utf8');
    console.log('✅ Migration file found and loaded');
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('COMMIT');
      console.log('🎉 019 Migration SUCCESS! Chat support tables are now available!');
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

run019Migration();
