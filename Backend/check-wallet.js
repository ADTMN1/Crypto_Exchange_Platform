import dotenv from 'dotenv';
import path from 'path';
import { query, pool } from './src/config/db.config.js';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const checkWallet = async () => {
  console.log('🔍 Checking wallet balances...');
  
  try {
    const walletResult = await query(`
      SELECT u.id, u.email, u.username, w.currency, w.balance, w.locked_balance
      FROM wallets w
      JOIN users u ON w.user_id = u.id
      ORDER BY w.created_at DESC
      LIMIT 10
    `);

    console.log('\n💰 Wallet Balances:');
    walletResult.rows.forEach(row => {
      console.log(`- User: ${row.username} (${row.email})`);
      console.log(`  Currency: ${row.currency}`);
      console.log(`  Available: ${row.balance}`);
      console.log(`  Locked: ${row.locked_balance}`);
      console.log('---');
    });

    console.log('\n✅ Check complete!');

  } catch (error) {
    console.error('❌ Error checking wallet:', error);
  } finally {
    await pool.end();
  }
};

checkWallet();
