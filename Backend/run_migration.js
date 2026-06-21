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
        console.log('📝 Running all migrations...\n');
        
        // Migration 0: Add screenshot_url to transactions
        console.log('0️⃣ Adding screenshot_url to transactions...');
        const migration0Path = path.join(__dirname, 'src/models/migrations/007_add_screenshot_url_to_transactions.sql');
        const sql0 = fs.readFileSync(migration0Path, 'utf8');
        await client.query(sql0);
        console.log('✅ Screenshot URL column added\n');
        
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
        
        // Migration 4: Create binary settings table
        console.log('4️⃣ Creating binary settings table...');
        const migration4Path = path.join(__dirname, 'src/models/migrations/010_create_binary_settings_table.sql');
        const sql4 = fs.readFileSync(migration4Path, 'utf8');
        await client.query(sql4);
        console.log('✅ Binary settings table created\n');
        
        // Migration 5: Create permissions and admin menu tables
        console.log('5️⃣ Creating permissions and admin menu tables...');
        const migration5Path = path.join(__dirname, 'src/models/migrations/011_create_permissions_and_menu_tables.sql');
        const sql5 = fs.readFileSync(migration5Path, 'utf8');
        await client.query(sql5);
        console.log('✅ Permissions and admin menu tables created\n');
        
        // Migration 6: Add KYC fields to user_status
        console.log('6️⃣ Adding KYC fields to user_status...');
        const migration6Path = path.join(__dirname, 'src/models/migrations/012_add_kyc_fields.sql');
        const sql6 = fs.readFileSync(migration6Path, 'utf8');
        await client.query(sql6);
        console.log('✅ KYC fields added\n');
        
        // Migration 7: Create withdrawals table
        console.log('7️⃣ Creating withdrawals table...');
        const migration7Path = path.join(__dirname, 'src/models/migrations/013_create_withdrawals_table.sql');
        const sql7 = fs.readFileSync(migration7Path, 'utf8');
        await client.query(sql7);
        console.log('✅ Withdrawals table created\n');
        
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
