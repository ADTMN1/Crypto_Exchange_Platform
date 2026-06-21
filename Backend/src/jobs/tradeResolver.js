import cron from 'node-cron';
import pool, { query } from '../config/db.config.js';
import priceService from '../services/price.service.js';
import walletService from '../services/wallet.service.js';
import tradingGateService from '../services/trading-gate.service.js';
import auditService from '../services/audit.service.js';
import notificationService from '../services/notification.service.js';

// Payout multiplier based on trade duration
const getPayoutMultiplier = (duration) => {
  const durationPercentMap = {
    30: 1.10,
    60: 1.15,
    90: 1.20,
    120: 1.20,
    180: 1.25,
    300: 1.30
  };
  return durationPercentMap[duration] || 1.10;
};

/**
 * Resolve a single binary trade.
 *
 * Gate OPEN   → always WIN  (release principal + credit profit)
 * Gate CLOSED → always LOSE (burn principal, payout = 0)
 *
 * Does NOT modify existing wallet service logic.
 * Adds: TRADE_WIN/TRADE_LOSS transaction record, audit log, user notification.
 */
const resolveTrade = async (trade, gateOpen) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Fetch close price for the record — non-fatal if unavailable
    let closePrice = parseFloat(trade.entry_price);
    try {
      closePrice = await priceService.getPrice(trade.pair);
    } catch (_) {}

    // Get wallet id for transaction record
    const walletRow = await client.query(
      `SELECT id FROM wallets WHERE user_id = $1 AND currency = 'USDT' LIMIT 1`,
      [trade.user_id]
    );
    const walletId = walletRow.rows[0]?.id ?? null;

    if (gateOpen) {
      // ── GATE OPEN → user always wins ──────────────────────────────────────
      const multiplier = getPayoutMultiplier(trade.duration);
      const payout     = parseFloat(trade.amount) * multiplier;
      const profit     = payout - parseFloat(trade.amount);

      await walletService.release(trade.user_id, 'USDT', parseFloat(trade.amount), client);

      if (profit > 0) {
        await walletService.credit(
          trade.user_id, 'USDT', profit, `BINARY_WIN_${trade.id}`, client
        );
      }

      await client.query(
        `UPDATE binary_trades
         SET status = 'win', close_price = $1, payout = $2, resolved_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [closePrice, payout, trade.id]
      );

      // TRADE_WIN transaction record
      if (walletId) {
        await client.query(
          `INSERT INTO transactions (user_id, wallet_id, type, currency, amount, fee, status, confirmed_at)
           VALUES ($1, $2, 'TRADE_WIN', 'USDT', $3, 0, 'completed', CURRENT_TIMESTAMP)`,
          [trade.user_id, walletId, payout]
        );
      }

      await client.query('COMMIT');
      console.log(`✅ Trade ${trade.id}: WIN [gate open] | Payout: ${payout} | Close: ${closePrice}`);

      // Audit log (fire-and-forget, outside transaction)
      auditService.createAudit({
        userId: trade.user_id,
        action: 'Trade settled as WIN',
        entityType: 'binary_trade',
        entityId: trade.id,
        metadata: { tradeId: trade.id, amount: trade.amount, payout, closePrice, marketStatus: 'open' },
      }).catch(e => console.error('Audit log failed:', e.message));

      // User notification (fire-and-forget)
      notificationService.sendToUser({
        userId: trade.user_id,
        type: 'TRADE_WIN',
        title: '🎉 Trade Won!',
        body: `Your ${trade.pair} trade settled as a WIN. Payout: ${payout.toFixed(2)} USDT`,
        metadata: { tradeId: trade.id, payout, pair: trade.pair },
      }).catch(e => console.error('Notification failed:', e.message));

    } else {
      // ── GATE CLOSED → user always loses ───────────────────────────────────
      await walletService.burn(trade.user_id, 'USDT', parseFloat(trade.amount), client);

      await client.query(
        `UPDATE binary_trades
         SET status = 'lose', close_price = $1, payout = 0, resolved_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [closePrice, trade.id]
      );

      // TRADE_LOSS transaction record
      if (walletId) {
        await client.query(
          `INSERT INTO transactions (user_id, wallet_id, type, currency, amount, fee, status, confirmed_at)
           VALUES ($1, $2, 'TRADE_LOSS', 'USDT', $3, 0, 'completed', CURRENT_TIMESTAMP)`,
          [trade.user_id, walletId, parseFloat(trade.amount)]
        );
      }

      await client.query('COMMIT');
      console.log(`✅ Trade ${trade.id}: LOSE [gate closed] | Burned: ${trade.amount} | Close: ${closePrice}`);

      // Audit log (fire-and-forget)
      auditService.createAudit({
        userId: trade.user_id,
        action: 'Trade settled as LOSS - market closed',
        entityType: 'binary_trade',
        entityId: trade.id,
        metadata: { tradeId: trade.id, amount: trade.amount, payout: 0, closePrice, marketStatus: 'closed' },
      }).catch(e => console.error('Audit log failed:', e.message));

      // User notification (fire-and-forget)
      notificationService.sendToUser({
        userId: trade.user_id,
        type: 'TRADE_LOSS',
        title: '📉 Trade Settled',
        body: `Your ${trade.pair} trade was settled. Amount of ${parseFloat(trade.amount).toFixed(2)} USDT has been deducted.`,
        metadata: { tradeId: trade.id, amount: trade.amount, pair: trade.pair },
      }).catch(e => console.error('Notification failed:', e.message));
    }

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`❌ Failed to resolve trade ${trade.id}:`, error.message);
  } finally {
    client.release();
  }
};

let resolverTask = null;
let isResolving = false;

/**
 * Binary Trade Resolver - Runs every 5 seconds
 * Resolves expired binary trades.
 * When the trading gate is CLOSED, all running trades resolve as losses.
 */
const resolveExpiredTrades = async () => {
  if (isResolving) {
    console.log('⏭️ Binary trade resolver still running, skipping this tick');
    return;
  }

  isResolving = true;
  console.log('🔄 Running binary trade resolver...');

  try {
    // Check gate status once per run — applies to all trades this tick
    const isGateOpen = await tradingGateService.isTradingOpen();

    // Find all running trades that have expired (or ALL running if gate is closed)
    const tradeQuery = isGateOpen
      ? `SELECT id, user_id, pair, direction, amount, entry_price, duration
         FROM binary_trades
         WHERE status = 'running' AND expires_at <= CURRENT_TIMESTAMP
         ORDER BY expires_at ASC`
      : `SELECT id, user_id, pair, direction, amount, entry_price, duration
         FROM binary_trades
         WHERE status = 'running'
         ORDER BY expires_at ASC`;

    const expiredTrades = await query(tradeQuery);

    if (expiredTrades.rows.length === 0) {
      console.log('✅ No trades to resolve');
      return;
    }

    if (!isGateOpen) {
      console.log(`🔴 Trading gate is CLOSED — force-resolving ${expiredTrades.rows.length} running trade(s) as LOSE`);
    } else {
      console.log(`📊 Found ${expiredTrades.rows.length} expired trade(s) to resolve`);
    }

    for (const trade of expiredTrades.rows) {
      await resolveTrade(trade, isGateOpen);
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
