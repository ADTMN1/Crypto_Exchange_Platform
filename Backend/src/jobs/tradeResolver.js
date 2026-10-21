import cron from 'node-cron';
import pool, { query } from '../config/db.config.js';
import priceService from '../services/price.service.js';
import walletService from '../services/wallet.service.js';
import tradingGateService from '../services/trading-gate.service.js';
import auditService from '../services/audit.service.js';
import notificationService from '../services/notification.service.js';
import { emitToUser } from '../websocket/socket.js';
import logger from '../utils/logger.js';

/**
 * Calculate real profit percentage based on entry and close price for a binary trade
 * @param {number} entryPrice - Price when trade was opened
 * @param {number} closePrice - Price when trade was closed
 * @param {string} direction - "BUY" or "SELL"
 * @returns {number} Profit percentage (e.g., 5 for 5% profit)
 */
const calculateProfitPercentage = (entryPrice, closePrice, direction) => {
  if (direction === 'BUY') {
    // For BUY: profit if close > entry
    return ((closePrice - entryPrice) / entryPrice) * 100;
  } else {
    // For SELL: profit if close < entry
    return ((entryPrice - closePrice) / entryPrice) * 100;
  }
};

// Helper to get binary settings
const getBinarySettings = async () => {
  const result = await query('SELECT * FROM binary_settings LIMIT 1');
  if (result.rows.length === 0) {
    throw new Error('Binary settings not found');
  }
  return result.rows[0];
};

/**
 * Resolve a single binary trade.
 *
 * Gate OPEN   → always WIN (fixed payout percentage from settings)
 * Gate CLOSED → always LOSE (no further deduction)
 */
const resolveTrade = async (trade, gateOpen) => {
    const traceId = `resolve-${trade.id}-${Date.now()}`;
    logger.info('Starting trade resolution', { 
        traceId,
        tradeId: trade.id,
        pair: trade.pair,
        direction: trade.direction,
        gateOpen,
    });
    
    const client = await pool.connect();
    try {
        logger.debug('Starting transaction', { traceId });
        await client.query('BEGIN');

        // Step 1.5: Lock the binary_trades row and check its current status
        logger.debug('Locking binary_trades row and checking status', { traceId });
        const tradeLockResult = await client.query(
            `SELECT status FROM binary_trades WHERE id = $1 FOR UPDATE`,
            [trade.id]
        );
        
        if (tradeLockResult.rows.length === 0) {
            logger.warn('Trade not found, skipping', { traceId });
            await client.query('ROLLBACK');
            return;
        }
        
        const currentStatus = tradeLockResult.rows[0].status;
        if (currentStatus !== 'running') {
            logger.info('Trade already resolved, skipping', { traceId, currentStatus });
            await client.query('ROLLBACK');
            return;
        }

        // Fetch close price (just for record keeping)
        logger.debug('Fetching close price', { traceId, pair: trade.pair });
        let closePrice = parseFloat(trade.entry_price);
        try {
            closePrice = await priceService.getPrice(trade.pair);
        } catch (err) {
            logger.warn('Could not fetch price, using entry price', { traceId, error: err.message });
        }

        // Get wallet id for transaction record
        logger.debug('Fetching USDT wallet id', { traceId });
        const walletRow = await client.query(
            `SELECT id FROM wallets WHERE user_id = $1 AND currency = 'USDT' LIMIT 1`,
            [trade.user_id]
        );
        const walletId = walletRow.rows[0]?.id ?? null;

        if (gateOpen) {
            logger.info('Gate is OPEN → USER WINS', { traceId });
            logger.debug('Getting binary settings', { traceId });
            const settings = await getBinarySettings();
            logger.debug('Binary settings retrieved', { traceId, 
                payout_percentage: settings.payout_percentage,
                trade_duration: trade.duration 
            });
            
            // Get duration-specific payout percentage, fall back to global payout_percentage
            const durationKey = String(trade.duration);
            let profitPercentage = settings.payout_percentage;
            
            if (settings.duration_payouts && settings.duration_payouts[durationKey] !== undefined) {
                profitPercentage = parseFloat(settings.duration_payouts[durationKey]);
                logger.debug('Using duration-specific payout', { traceId, duration: trade.duration, profitPercentage });
            } else {
                logger.debug('No specific payout, using global', { traceId, duration: trade.duration, profitPercentage });
            }
            
            const profit = (parseFloat(trade.amount) * profitPercentage) / 100;
            const payout = parseFloat(trade.amount) + profit;

            logger.debug('Releasing original amount from locked balance', { traceId });
            await walletService.release(trade.user_id, 'USDT', parseFloat(trade.amount), client);
            logger.debug('Original amount released', { traceId });

            logger.debug('Adding profit to balance', { traceId });
            await walletService.add(trade.user_id, profit, 'TRADE_WIN', client);
            logger.debug('Profit added', { traceId });

            logger.debug('Updating trade status to WIN', { traceId });
            await client.query(
                `UPDATE binary_trades
                 SET status = 'win', close_price = $1, payout = $2, resolved_at = CURRENT_TIMESTAMP
                 WHERE id = $3`,
                [closePrice, payout, trade.id]
            );
            logger.debug('Trade status updated', { traceId });

            await client.query('COMMIT');
            logger.info('Transaction committed (WIN)', { traceId });

            // Emit WebSocket event to frontend for real-time update
            emitToUser(trade.user_id, 'trade_completed', {
                tradeId: trade.id,
                status: 'win',
                payout,
                profit,
                closePrice,
                pair: trade.pair
            }).catch(err => logger.error('Failed to emit trade_completed event', { traceId, error: err.message }));

            // Audit log (fire-and-forget, outside transaction)
            auditService.createAudit({
                userId: trade.user_id,
                action: 'Trade settled as WIN',
                entityType: 'binary_trade',
                entityId: trade.id,
                metadata: { tradeId: trade.id, amount: trade.amount, profitPercentage, payout, closePrice, marketStatus: 'open' },
            }).catch(e => logger.error('Audit log failed', { traceId, error: e.message }));

            // User notification (fire-and-forget)
            notificationService.sendToUser({
                userId: trade.user_id,
                type: 'TRADE_WIN',
                title: '🎉 Trade Won!',
                body: `Your ${trade.pair} trade settled as a WIN with ${profitPercentage.toFixed(2)}% profit! Payout: ${payout.toFixed(2)} USDT`,
                metadata: { tradeId: trade.id, profitPercentage, payout, pair: trade.pair },
            }).catch(e => logger.error('Notification failed', { traceId, error: e.message }));

        } else {
            logger.info('Gate is CLOSED → USER LOSES', { traceId });

            logger.debug('Burning locked amount', { traceId });
            await walletService.burn(trade.user_id, 'USDT', parseFloat(trade.amount), client);
            logger.debug('Amount burned', { traceId });

            // Record TRADE_LOSS transaction
            logger.debug('Recording TRADE_LOSS transaction', { traceId });
            await client.query(
                `INSERT INTO transactions (user_id, wallet_id, type, currency, amount, fee, status, confirmed_at)
                 VALUES ($1, $2, 'TRADE_LOSS', 'USDT', $3, 0, 'completed', CURRENT_TIMESTAMP)`,
                [trade.user_id, walletId, trade.amount]
            );

            logger.debug('Updating trade status to LOSE', { traceId });
            await client.query(
                `UPDATE binary_trades
                 SET status = 'lose', close_price = $1, payout = 0, resolved_at = CURRENT_TIMESTAMP
                 WHERE id = $2`,
                [closePrice, trade.id]
            );
            logger.debug('Trade status updated', { traceId });

            await client.query('COMMIT');
            logger.info('Transaction committed (LOSE)', { traceId });

            // Emit WebSocket event to frontend for real-time update
            emitToUser(trade.user_id, 'trade_completed', {
                tradeId: trade.id,
                status: 'lose',
                payout: 0,
                profit: -parseFloat(trade.amount),
                closePrice,
                pair: trade.pair
            }).catch(err => logger.error('Failed to emit trade_completed event', { traceId, error: err.message }));

            // Audit log (fire-and-forget)
            auditService.createAudit({
                userId: trade.user_id,
                action: 'Trade settled as LOSS - market closed',
                entityType: 'binary_trade',
                entityId: trade.id,
                metadata: { tradeId: trade.id, amount: trade.amount, payout: 0, closePrice, marketStatus: 'closed' },
            }).catch(e => logger.error('Audit log failed', { traceId, error: e.message }));

            // User notification (fire-and-forget)
            notificationService.sendToUser({
                userId: trade.user_id,
                type: 'TRADE_LOSS',
                title: '📉 Trade Settled',
                body: `Your ${trade.pair} trade was settled. Amount of ${parseFloat(trade.amount).toFixed(2)} USDT has been deducted.`,
                metadata: { tradeId: trade.id, amount: trade.amount, pair: trade.pair },
            }).catch(e => logger.error('Notification failed', { traceId, error: e.message }));
        }

    } catch (error) {
        logger.error('Error in transaction, rolling back', { 
            traceId,
            message: error.message,
            stack: error.stack
        });
        await client.query('ROLLBACK');
        logger.error('Trade resolution failed', { traceId });
    } finally {
        logger.debug('Releasing database client', { traceId });
        client.release();
    }
};

let resolverTask = null;
let isResolving = false;

/**
 * Deactivate resolver if needed (event-driven deactivation)
 * Checks if there are remaining running trades
 * Stops resolver when no active trades remain
 */
const deactivateResolverIfNeeded = async () => {
  try {
    // If resolver is not running, no action needed
    if (!resolverTask) {
      logger.info('Resolver already stopped, skipping deactivation');
      return;
    }

    // Check if there are running trades
    const hasRunningTrades = await query(
      `SELECT EXISTS(
         SELECT 1 FROM binary_trades WHERE status = 'running'
       ) as has_trades`
    );

    if (!hasRunningTrades.rows[0].has_trades) {
      stopBinaryTradeResolver();
      logger.info('Resolver deactivated (no running trades)');
    } else {
      logger.info('Running trades still exist, resolver remains active');
    }
  } catch (error) {
    logger.error('Error in deactivateResolverIfNeeded', { error: error.message });
    // Don't throw - this is a best-effort deactivation
  }
};

// Export for use in other modules
export { deactivateResolverIfNeeded };

/**
 * Binary Trade Resolver - Runs every 5 seconds
 * Resolves expired binary trades.
 * Only resolves expired trades, even if gate is closed.
 */
const resolveExpiredTrades = async () => {
  if (isResolving) {
    logger.debug('Binary trade resolver still running, skipping this tick');
    return;
  }

  isResolving = true;
  logger.info('Running binary trade resolver');

  try {
    // Early exit: Check if any running trades exist before running expensive queries
    const hasRunningTrades = await query(
      `SELECT EXISTS(
         SELECT 1 FROM binary_trades WHERE status = 'running'
       ) as has_trades`
    );
    
    if (!hasRunningTrades.rows[0].has_trades) {
      logger.info('No running trades, skipping resolver execution');
      return;
    }

    // Find all running trades that have EXPIRED using the server's current time to avoid clock/timezone drift
    const expiredTrades = await query(`
      SELECT id, user_id, pair, direction, amount, entry_price, duration
      FROM binary_trades
      WHERE status = 'running' AND expires_at <= $1
      ORDER BY expires_at ASC
    `, [new Date()]);

    if (expiredTrades.rows.length === 0) {
      logger.info('No expired trades to resolve');
      return;
    }

    logger.info('Found expired trades to resolve', { count: expiredTrades.rows.length });

    // Check gate status ONCE per resolver batch using DIRECT DB READ (no cache).
    // Critical: stale cache here caused incorrect WIN payouts when gate was actually closed.
    const isGateOpenNow = await tradingGateService.isTradingOpenDirect();
    logger.info('Trading gate status for this resolution batch', { 
      isGateOpen: isGateOpenNow, 
      expiredTradesCount: expiredTrades.rows.length 
    });

    for (const trade of expiredTrades.rows) {
      await resolveTrade(trade, isGateOpenNow);
    }

    logger.info('Binary trade resolver completed');

    // Check if resolver should be deactivated (no running trades remaining)
    await deactivateResolverIfNeeded().catch(err => {
      logger.error('Failed to check resolver deactivation', { error: err.message });
    });

  } catch (error) {
    logger.error('Trade resolver job error', { error: error.message });
  } finally {
    isResolving = false;
  }
};

export const startBinaryTradeResolver = () => {
  if (resolverTask) {
    return resolverTask;
  }

  resolverTask = cron.schedule('*/5 * * * * *', resolveExpiredTrades);
  logger.info('Binary trade resolver cron job started (runs every 5 seconds)');
  return resolverTask;
};

export const stopBinaryTradeResolver = () => {
  if (!resolverTask) {
    return;
  }

  resolverTask.stop();
  resolverTask = null;
  logger.info('Binary trade resolver cron job stopped');
};

/**
 * Activate resolver if needed (event-driven activation)
 * Checks if resolver is running and if running trades exist
 * Starts resolver only when both conditions are met
 */
export const activateResolverIfNeeded = async () => {
  try {
    // If resolver is already running, no action needed
    if (resolverTask) {
      logger.info('Resolver already running, skipping activation');
      return;
    }

    // Check if there are running trades
    const hasRunningTrades = await query(
      `SELECT EXISTS(
         SELECT 1 FROM binary_trades WHERE status = 'running'
       ) as has_trades`
    );

    if (hasRunningTrades.rows[0].has_trades) {
      startBinaryTradeResolver();
      logger.info('Resolver activated (running trades detected)');
    } else {
      logger.info('No running trades, resolver remains stopped');
    }
  } catch (error) {
    logger.error('Error in activateResolverIfNeeded', { error: error.message });
    // Don't throw - this is a best-effort activation
  }
};

export default resolveExpiredTrades;
