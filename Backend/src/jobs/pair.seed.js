import { query } from '../config/db.config.js';

/**
 * Seed default trading pairs
 */
async function seedTradingPairs() {
  console.log('🌱 Seeding trading pairs...');

  const pairs = [
    {
      base: 'BTC',
      quote: 'USDT',
      min: '0.00001000',
      max: '100.00000000',
      price_precision: 2,
      qty_precision: 8,
      maker_fee: '0.0010',
      taker_fee: '0.0010',
      active: true,
    },
    {
      base: 'ETH',
      quote: 'USDT',
      min: '0.00010000',
      max: '1000.00000000',
      price_precision: 2,
      qty_precision: 8,
      maker_fee: '0.0010',
      taker_fee: '0.0010',
      active: true,
    },
    {
      base: 'BNB',
      quote: 'USDT',
      min: '0.00100000',
      max: '10000.00000000',
      price_precision: 2,
      qty_precision: 8,
      maker_fee: '0.0010',
      taker_fee: '0.0010',
      active: true,
    },
    {
      base: 'SOL',
      quote: 'USDT',
      min: '0.01000000',
      max: '10000.00000000',
      price_precision: 2,
      qty_precision: 8,
      maker_fee: '0.0010',
      taker_fee: '0.0010',
      active: true,
    },
    {
      base: 'XRP',
      quote: 'USDT',
      min: '1.00000000',
      max: '100000.00000000',
      price_precision: 4,
      qty_precision: 8,
      maker_fee: '0.0010',
      taker_fee: '0.0010',
      active: true,
    },
    {
      base: 'ADA',
      quote: 'USDT',
      min: '1.00000000',
      max: '100000.00000000',
      price_precision: 4,
      qty_precision: 8,
      maker_fee: '0.0010',
      taker_fee: '0.0010',
      active: true,
    },
    {
      base: 'DOGE',
      quote: 'USDT',
      min: '10.00000000',
      max: '1000000.00000000',
      price_precision: 6,
      qty_precision: 8,
      maker_fee: '0.0010',
      taker_fee: '0.0010',
      active: true,
    },
    {
      base: 'AVAX',
      quote: 'USDT',
      min: '0.01000000',
      max: '10000.00000000',
      price_precision: 2,
      qty_precision: 8,
      maker_fee: '0.0010',
      taker_fee: '0.0010',
      active: true,
    },
    {
      base: 'DOT',
      quote: 'USDT',
      min: '0.10000000',
      max: '10000.00000000',
      price_precision: 3,
      qty_precision: 8,
      maker_fee: '0.0010',
      taker_fee: '0.0010',
      active: true,
    },
    {
      base: 'MATIC',
      quote: 'USDT',
      min: '1.00000000',
      max: '100000.00000000',
      price_precision: 4,
      qty_precision: 8,
      maker_fee: '0.0010',
      taker_fee: '0.0010',
      active: true,
    },
  ];

  let inserted = 0;
  let skipped = 0;

  for (const pair of pairs) {
    try {
      // Check if pair already exists
      const existing = await query(
        'SELECT id FROM trading_pairs WHERE base_currency = $1 AND quote_currency = $2',
        [pair.base, pair.quote]
      );

      if (existing.rows.length > 0) {
        console.log(`⏭️  Skipping ${pair.base}/${pair.quote} - already exists`);
        skipped++;
        continue;
      }

      // Insert trading pair
      await query(
        `INSERT INTO trading_pairs 
         (base_currency, quote_currency, min_order_size, max_order_size, 
          price_precision, qty_precision, maker_fee, taker_fee, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          pair.base,
          pair.quote,
          pair.min,
          pair.max,
          pair.price_precision,
          pair.qty_precision,
          pair.maker_fee,
          pair.taker_fee,
          pair.active,
        ]
      );

      console.log(`✅ Created trading pair: ${pair.base}/${pair.quote}`);
      inserted++;
    } catch (error) {
      console.error(`❌ Failed to create ${pair.base}/${pair.quote}:`, error.message);
    }
  }

  console.log(`\n📊 Summary: ${inserted} pairs created, ${skipped} skipped\n`);
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedTradingPairs()
    .then(() => {
      console.log('✅ Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

export default seedTradingPairs;