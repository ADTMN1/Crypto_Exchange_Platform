/**
 * fix_locked_balance.js
 *
 * Diagnoses and fixes stuck locked_balance caused by:
 *  - Binary trades that resolved (win/lose) but their locked amount was never released
 *  - Old pending withdrawals that were never processed
 *
 * Run with: node fix_locked_balance.js
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import pool from './src/config/db.config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env') });

async function fixLockedBalances() {
  const client = await pool.connect();
  try {
    console.log('🔍 Diagnosing locked balance issues...\n');

    // 1. Show current wallet state
    const walletState = await client.query(`
      SELECT w.id, u.email, u.username,
             w.balance, w.locked_balance, w.usd_value,
             (w.balance + w.locked_balance) as real_total
      FROM wallets w
      JOIN users u ON u.id = w.user_id
      WHERE w.currency = 'USDT' AND w.locked_balance > 0
      ORDER BY w.locked_balance DESC
    `);

    console.log(`Found ${walletState.rows.length} wallet(s) with locked balance:\n`);
    for (const row of walletState.rows) {
      console.log(`  ${row.email} (${row.username})`);
      console.log(`    Available balance:  $${parseFloat(row.balance).toFixed(2)}`);
      console.log(`    Locked balance:     $${parseFloat(row.locked_balance).toFixed(2)}`);
      console.log(`    Total (usd_value):  $${parseFloat(row.usd_value).toFixed(2)}`);
      console.log('');
    }

    // 2. Find locked amounts from already-resolved binary trades
    // These are trades that ended (win/lose/expired) but their locked_balance was not properly cleared
    const stuckTrades = await client.query(`
      SELECT bt.user_id, u.email, SUM(bt.amount) as stuck_amount
      FROM binary_trades bt
      JOIN users u ON u.id = bt.user_id
      WHERE bt.status IN ('win', 'lose', 'expired')
        AND bt.resolved_at IS NOT NULL
      GROUP BY bt.user_id, u.email
    `);

    if (stuckTrades.rows.length > 0) {
      console.log('📊 Resolved trades per user (for reference):');
      for (const row of stuckTrades.rows) {
        console.log(`  ${row.email}: total resolved trade amounts = $${parseFloat(row.stuck_amount).toFixed(2)}`);
      }
      console.log('');
    }

    // 3. Find pending withdrawals (these SHOULD keep their locked balance — don't touch them)
    const pendingWithdrawals = await client.query(`
      SELECT wr.user_id, u.email, SUM(wr.amount) as pending_amount
      FROM withdrawals wr
      JOIN users u ON u.id = wr.user_id
      WHERE wr.status = 'PENDING'
      GROUP BY wr.user_id, u.email
    `);

    const pendingMap = {};
    for (const row of pendingWithdrawals.rows) {
      pendingMap[row.user_id] = parseFloat(row.pending_amount);
    }

    if (pendingWithdrawals.rows.length > 0) {
      console.log('⏳ Pending withdrawals (locked balance will be preserved):');
      for (const row of pendingWithdrawals.rows) {
        console.log(`  ${row.email}: $${parseFloat(row.pending_amount).toFixed(2)} reserved for pending withdrawal`);
      }
      console.log('');
    }

    // 4. Fix: for each wallet with locked_balance, calculate what SHOULD be locked
    //    (only pending withdrawals) and release the rest back to balance
    console.log('🔧 Fixing stuck locked balances...\n');

    await client.query('BEGIN');

    let fixedCount = 0;
    for (const row of walletState.rows) {
      const currentLocked = parseFloat(row.locked_balance);
      const shouldBeLockedForWithdrawals = pendingMap[row.id] || 0;

      // Also check for running binary trades that are still active
      const runningTrades = await client.query(`
        SELECT COALESCE(SUM(amount), 0) as running_amount
        FROM binary_trades
        WHERE user_id = $1 AND status = 'running'
      `, [row.id]);
      const runningTradeAmount = parseFloat(runningTrades.rows[0].running_amount);

      const shouldBeLocked = shouldBeLockedForWithdrawals + runningTradeAmount;
      const excess = currentLocked - shouldBeLocked;

      console.log(`  ${row.email}:`);
      console.log(`    Currently locked:        $${currentLocked.toFixed(2)}`);
      console.log(`    Should be locked (withdrawals + active trades): $${shouldBeLocked.toFixed(2)}`);
      console.log(`    Excess to release:       $${Math.max(0, excess).toFixed(2)}`);

      if (excess > 0.001) {
        // Release excess back to available balance
        await client.query(`
          UPDATE wallets
          SET locked_balance = $1,
              balance = balance + $2,
              usd_value = balance + $1 + $2,
              updated_at = NOW()
          WHERE id = $3
        `, [shouldBeLocked, excess, row.id]);

        console.log(`    ✅ Released $${excess.toFixed(2)} back to available balance`);
        fixedCount++;
      } else {
        console.log(`    ✓ No excess locked balance to release`);
      }
      console.log('');
    }

    await client.query('COMMIT');

    // 5. Show final state
    const finalState = await client.query(`
      SELECT u.email, w.balance, w.locked_balance, w.usd_value
      FROM wallets w
      JOIN users u ON u.id = w.user_id
      WHERE w.currency = 'USDT'
      ORDER BY w.usd_value DESC
      LIMIT 10
    `);

    console.log('📊 Final wallet state (top 10 by total):');
    for (const row of finalState.rows) {
      console.log(`  ${row.email}: available=$${parseFloat(row.balance).toFixed(2)}, locked=$${parseFloat(row.locked_balance).toFixed(2)}, total=$${parseFloat(row.usd_value).toFixed(2)}`);
    }

    console.log(`\n✅ Done. Fixed ${fixedCount} wallet(s).`);

  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('❌ Error:', err.message);
    console.error(err.stack);
  } finally {
    client.release();
    await pool.end();
  }
}

fixLockedBalances();
