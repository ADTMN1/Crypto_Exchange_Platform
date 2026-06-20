import { Pool } from '@neondatabase/serverless';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';
import ws from 'ws';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
    const pool = new Pool({ 
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    const client = await pool.connect();

    try {
        console.log('📝 Running support ticket migrations...\n');
        
        // Migration 1: Update support_tickets table structure
        console.log('1️⃣ Updating support_tickets table...');
        const migration1Path = path.join(__dirname, 'src/models/migrations/008_update_support_tickets_table.sql');
        const sql1 = fs.readFileSync(migration1Path, 'utf8');
        await client.query(sql1);
        console.log('✅ Support tickets table updated\n');
        
        // Migration 2: Create ticket_replies table
        console.log('2️⃣ Creating ticket_replies table...');
        const migration2Path = path.join(__dirname, 'src/models/migrations/007_create_ticket_replies_table.sql');
        const sql2 = fs.readFileSync(migration2Path, 'utf8');
        await client.query(sql2);
        console.log('✅ Ticket replies table created\n');
        
        // Migration 3: Create FAQs and blacklist tables
        console.log('3️⃣ Creating FAQs and spam protection tables...');
        const migration3Path = path.join(__dirname, 'src/models/migrations/009_create_missing_support_tables.sql');
        const sql3 = fs.readFileSync(migration3Path, 'utf8');
        await client.query(sql3);
        console.log('✅ FAQs and spam protection tables created\n');
        
        console.log('🎉 All migrations completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error(error);
        throw error;
    } finally {
        client.release();
        await pool.end();
        process.exit(0);
    }
}

runMigrations().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
