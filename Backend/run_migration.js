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

    // Migration 3: Create FAQs and spam protection tables
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

    // Migration 8: Add usd_value to wallets
    console.log('8️⃣ Adding usd_value to wallets...');
    const migration8Path = path.join(__dirname, 'src/models/migrations/014_add_usd_value_to_wallets.sql');
    const sql8 = fs.readFileSync(migration8Path, 'utf8');
    try {
      await client.query(sql8);
      console.log('✅ usd_value column added to wallets\n');
    } catch (err: any) {
      if (err.code === '42701') {
        console.log('ℹ️ usd_value column already exists, skipping migration 8\n');
      } else {
        throw err;
      }
    }

    // Migration 9: Add TRADE_WIN and TRADE_LOSS to transaction_type_enum
    console.log('9️⃣ Adding TRADE_WIN and TRADE_LOSS to transaction_type_enum...');
    const migration9Path = path.join(__dirname, 'src/models/migrations/015_add_trade_types_to_transaction_enum.sql');
    const sql9 = fs.readFileSync(migration9Path, 'utf8');
    await client.query(sql9);
    console.log('✅ Trade types added to transaction_type_enum\n');

    // Migration 10: Update binary allowed expirations
    console.log('🔟 Updating binary allowed expirations...');
    const migration10Path = path.join(__dirname, 'src/models/migrations/016_update_binary_allowed_expirations.sql');
    const sql10 = fs.readFileSync(migration10Path, 'utf8');
    await client.query(sql10);
    console.log('✅ Binary allowed expirations updated\n');

    // Migration 11: Add gold pairs to binary allowed pairs
    console.log('1️⃣1️⃣ Adding gold pairs to binary allowed pairs...');
    const migration11Path = path.join(__dirname, 'src/models/migrations/017_add_gold_pairs_to_binary_allowed_pairs.sql');
    const sql11 = fs.readFileSync(migration11Path, 'utf8');
    await client.query(sql11);
    console.log('✅ Gold pairs added to binary allowed pairs\n');

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

// Only run migrations if this file is executed directly (not imported)
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigrations().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}

export { runMigrations };
