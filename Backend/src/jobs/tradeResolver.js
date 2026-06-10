import cron from 'node-cron';
import pool, { query } from '../config/db.config.js';
import priceService from '../services/price.service.js';
import walletService from '../services/wallet.service.js';

/**
 * Binary Trade Resolver - Runs every 30 seconds
 * Resolves expired binary trades
 */
const resolveExpiredTrades = async () => {
  console.log('🔄 Running binary trade resolver...');

  try {
    // Find all running trades that have expired
    const expiredTrades = await query(
      `SELECT id, user_id, pair, direction, amount, entry_price
       FROM binary_trades
       WHERE status = 'running' AND expires_at <= CURRENT_TIMESTAMP
       ORDER BY expires_at ASC`
    );

    if (expiredTrades.rows.length === 0) {
      console.log('✅ No expired trades to resolve');
      return;
    }

    console.log(`📊 Found ${expiredTrades.rows.length} expired trades to resolve`);

    // Process each trade individually
    for (const trade of expiredTrades.rows) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // Fetch current close price
        const closePrice = await priceService.getPrice(trade.pair);

        // Determine win/lose
        let status = 'lose';
        let payout = 0;

        const priceWentUp = closePrice > parseFloat(trade.entry_price);
        const priceWentDown = closePrice < parseFloat(trade.entry_price);

        if (
          (trade.direction === 'UP' && priceWentUp) ||
          (trade.direction === 'DOWN' && priceWentDown)
        ) {
          status = 'win';
          payout = parseFloat(trade.amount) * 1.85;
        }

        // Burn the locked amount
        await walletService.burn(trade.user_id, 'USDT', parseFloat(trade.amount), client);

        // If won, credit the payout
        if (status === 'win') {
          await walletService.credit(
            trade.user_id,
            'USDT',
            payout,
            `BINARY_WIN_${trade.id}`,
            client
          );
        }

        // Update trade record
        await client.query(
          `UPDATE binary_trades
           SET status = $1, close_price = $2, payout = $3, resolved_at = CURRENT_TIMESTAMP
           WHERE id = $4`,
          [status, closePrice, payout, trade.id]
        );

        await client.query('COMMIT');

        console.log(`✅ Resolved trade ${trade.id}: ${status.toUpperCase()} | Entry: ${trade.entry_price} | Close: ${closePrice} | Payout: ${payout}`);

      } catch (error) {
        await client.query('ROLLBACK');
        console.error(`❌ Failed to resolve trade ${trade.id}:`, error.message);
        // Continue with next trade - don't crash the entire job
      } finally {
        client.release();
      }
    }

    console.log('✅ Binary trade resolver completed');

  } catch (error) {
    console.error('❌ Trade resolver job error:', error.message);
  }
};

// Schedule job to run every 30 seconds
cron.schedule('*/30 * * * * *', resolveExpiredTrades);

console.log('🚀 Binary trade resolver cron job started (runs every 30 seconds)');

export default resolveExpiredTrades;
