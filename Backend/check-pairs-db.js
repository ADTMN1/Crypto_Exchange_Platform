import { query } from './src/config/db.config.js';

async function checkPairs() {
  try {
    console.log('🔍 Checking trading_pairs table...\n');

    // Check if table exists
    const tableCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'trading_pairs'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('❌ trading_pairs table does not exist!');
      console.log('   Run your schema.sql to create it.');
      return;
    }

    console.log('✅ trading_pairs table exists\n');

    // Count pairs
    const count = await query('SELECT COUNT(*) FROM trading_pairs');
    console.log(`📊 Total pairs in database: ${count.rows[0].count}\n`);

    // Get all pairs
    const pairs = await query(`
      SELECT id, base_currency, quote_currency, is_active 
      FROM trading_pairs 
      ORDER BY base_currency
    `);

    if (pairs.rows.length === 0) {
      console.log('⚠️  No trading pairs found!');
      console.log('   Run: cd Backend && node src/jobs/pair.seed.js\n');
      return;
    }

    console.log('Trading Pairs:');
    console.log('─────────────────────────────────────────');
    pairs.rows.forEach(pair => {
      const status = pair.is_active ? '✅ ACTIVE' : '❌ INACTIVE';
      console.log(`${pair.base_currency}/${pair.quote_currency} - ${status}`);
    });
    console.log('─────────────────────────────────────────\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

checkPairs();
