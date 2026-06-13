import { query } from '../config/db.config.js';

/**
 * Seed the trading_gate table with initial data
 * This creates the initial trading gate record with 'open' status
 */
const seedTradingGate = async () => {
  try {
    console.log('🌱 Seeding trading_gate table...');

    // Check if records already exist
    const existingRecords = await query('SELECT COUNT(*) as count FROM trading_gate');
    const recordCount = parseInt(existingRecords.rows[0].count);

    if (recordCount > 0) {
      console.log('✅ Trading gate records already exist, skipping seed');
      return;
    }

    // Insert initial trading gate record
    const insertQuery = `
      INSERT INTO trading_gate (status, changed_by, changed_at)
      VALUES ($1, $2, NOW())
      RETURNING *
    `;

    const values = [
      'open',        // status: start with trading open
      'system'       // changed_by: system initialization
    ];

    const result = await query(insertQuery, values);
    const gateRecord = result.rows[0];

    console.log('✅ Trading gate seeded successfully:');
    console.log(`   ID: ${gateRecord.id}`);
    console.log(`   Status: ${gateRecord.status}`);
    console.log(`   Changed By: ${gateRecord.changed_by}`);
    console.log(`   Changed At: ${gateRecord.changed_at}`);

  } catch (error) {
    console.error('❌ Error seeding trading_gate table:', error);
    throw error;
  }
};

/**
 * Run seed if called directly
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  seedTradingGate()
    .then(() => {
      console.log('🎉 Trading gate seed completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Trading gate seed failed:', error);
      process.exit(1);
    });
}

export default seedTradingGate;