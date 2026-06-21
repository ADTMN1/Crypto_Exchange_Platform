import cron from 'node-cron';
import pool, { query } from '../config/db.config.js';
import priceService from '../services/price.service.js';
import walletService from '../services/wallet.service.js';

let resolverTask = null;
let isResolving = false;

/**
 * Binary Trade Resolver - Runs every 5 seconds
 * Resolves expired binary trades
 */
const resolveExpiredTrades = async () => {
  if (isResolving) {
    console.log('⏭️ Binary trade resolver still running, skipping this tick');
    return;
  }

  isResolving = true;
  console.log('🔄 Running binary trade resolver...');

  try {
    // Find all running trades that have expired
    const expiredTrades = await query(
      `SELECT id, user_id, pair, direction, amount, entry_price, duration
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

        // Get payout percentage based on duration
        const getPayoutMultiplier = (duration) => {
          const durationPercentMap = {
            30: 1.10,  // 10%
            60: 1.15,  // 15%
            90: 1.20,  // 20%
            120: 1.20, // 20%
            180: 1.25, // 25%
            300: 1.30  // 30%
          };
          // Fallback to 1.10 if duration not found
          return durationPercentMap[duration] || 1.10;
        };

        if (
          (trade.direction === 'BUY' && priceWentUp) ||
          (trade.direction === 'SELL' && priceWentDown)
        ) {
          status = 'win';
          const multiplier = getPayoutMultiplier(trade.duration);
          payout = parseFloat(trade.amount) * multiplier;
        }

        if (status === 'win') {
          // Release the original locked amount (back to balance)
          await walletService.release(trade.user_id, 'USDT', parseFloat(trade.amount), client);
          
          // Credit the payout (which is total return: principal + profit)
          // Wait, payout already includes principal, so we need to calculate just profit!
          // Because release already returns the principal!
          const profit = payout - parseFloat(trade.amount);
          if (profit > 0) {
            await walletService.credit(
              trade.user_id,
              'USDT',
              profit,
              `BINARY_WIN_${trade.id}`,
              client
            );
          }
        } else {
          // Burn the locked amount
          await walletService.burn(trade.user_id, 'USDT', parseFloat(trade.amount), client);
        }

        // Update trade record
        await client.query(
          `UPDATE binary_trades
           SET status = $1, close_price = $2, payout = $3, resolved_at = CURRENT_TIMESTAMP
           WHERE id = $4`,
          [status, closePrice, payout, trade.id]
        );

        await client.query('COMMIT');

        console.log(`✅ Resolved trade ${trade.id}: ${status.toUpperCase()} | Entry: ${trade.entry_price} | Close: ${closePrice} | Duration: ${trade.duration}s | Payout: ${payout}`);

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
  } finally {
    isResolving = false;
  }
};

export const startBinaryTradeResolver = () => {
  if (resolverTask) {
    return resolverTask;
  }

  resolverTask = cron.schedule('*/5 * * * * *', resolveExpiredTrades);
  console.log('🚀 Binary trade resolver cron job started (runs every 5 seconds)');
  return resolverTask;
};

export const stopBinaryTradeResolver = () => {
  if (!resolverTask) {
    return;
  }

  resolverTask.stop();
  resolverTask = null;
  console.log('🛑 Binary trade resolver cron job stopped');
};

export default resolveExpiredTrades;
