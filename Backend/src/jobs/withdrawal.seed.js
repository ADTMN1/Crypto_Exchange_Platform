import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';
import pool from '../config/db.config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function seedWithdrawals() {
  console.log('💸 Starting withdrawal seed — reading real DB data...\n');

  const client = await pool.connect();

  try {
    // ── 1. Inspect real users ──────────────────────────────────────────────
    const usersRes = await client.query(`
      SELECT u.id, u.username, u.email, r.name AS role
      FROM users u
      LEFT JOIN roles r ON r.id = u.role_id
      ORDER BY u.created_at ASC
      LIMIT 20
    `);

    console.log(`👥 Found ${usersRes.rows.length} users:`);
    usersRes.rows.forEach((u) =>
      console.log(`   [${u.role}] ${u.username} <${u.email}> — id: ${u.id}`)
    );
    console.log();

    // ── 2. Inspect real wallets ────────────────────────────────────────────
    const walletsRes = await client.query(`
      SELECT w.id, w.user_id, w.currency, w.balance, w.locked_balance, u.username, r.name AS role
      FROM wallets w
      JOIN users u ON u.id = w.user_id
      LEFT JOIN roles r ON r.id = u.role_id
      ORDER BY w.created_at ASC
      LIMIT 30
    `);

    console.log(`👛 Found ${walletsRes.rows.length} wallets:`);
    walletsRes.rows.forEach((w) =>
      console.log(
        `   ${w.username} [${w.currency}] balance=${w.balance} locked=${w.locked_balance} wallet_id=${w.id}`
      )
    );
    console.log();

    // ── 3. Resolve admin ──────────────────────────────────────────────────
    const adminRow = usersRes.rows.find((u) => u.role === 'admin');
    if (!adminRow) {
      console.log('⚠️  No admin user found — processed_by will be NULL');
    } else {
      console.log(`🔑 Admin found: ${adminRow.username} (${adminRow.id})\n`);
    }
    const adminId = adminRow?.id ?? null;

    // ── 4. Pick non-admin users that have wallets ─────────────────────────
    const userWallets = walletsRes.rows.filter((w) => w.role !== 'admin');

    if (userWallets.length === 0) {
      console.log('⚠️  No non-admin wallets found.\n');
      console.log('   Try seeding users + wallets first, then re-run this seed.');
      return;
    }

    // Deduplicate: one entry per user (take first wallet per user)
    const seen = new Set();
    const picks = [];
    for (const w of userWallets) {
      if (!seen.has(w.user_id)) {
        seen.add(w.user_id);
        picks.push(w);
      }
      if (picks.length >= 5) break;
    }

    // Pad with the first pick if we have fewer than 3
    while (picks.length < 3) picks.push(picks[0]);

    const [p0, p1, p2, p3, p4] = picks;

    // ── 5. Build seed records ─────────────────────────────────────────────
    // Realistic crypto addresses (valid-looking, not real)
    const addresses = {
      TRC20:  'TYasdf1234XbcDEF567890GHIjkl09876MNOP',
      ERC20:  '0xAbCdEf1234567890abcdef1234567890AbCdEf12',
      BEP20:  '0xBEP201234567890abcdef1234567890BeP20AB12',
      BTC:    'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    };

    const now = new Date();
    const ago = (ms) => new Date(now - ms);
    const mins = (n) => n * 60 * 1000;
    const hrs  = (n) => n * 3600 * 1000;
    const days = (n) => n * 86400 * 1000;

    const seeds = [
      // ── PENDING — just submitted ─────────────────────────────────────────
      {
        label: 'PENDING (fresh)',
        user_id: p0.user_id, wallet_id: p0.id,
        amount: 75.50, fee: 1.50, currency: p0.currency,
        withdrawal_address: addresses.TRC20,
        network: 'TRC20', payment_method: 'crypto',
        status: 'PENDING',
        admin_note: null, rejection_reason: null,
        processed_by: null, processed_at: null,
        approved_at: null, completed_at: null,
        created_at: ago(mins(12)),
      },
      // ── PENDING — older, waiting ─────────────────────────────────────────
      {
        label: 'PENDING (waiting 2h)',
        user_id: p1.user_id, wallet_id: p1.id,
        amount: 200.00, fee: 2.00, currency: p1.currency,
        withdrawal_address: addresses.ERC20,
        network: 'ERC20', payment_method: 'crypto',
        status: 'PENDING',
        admin_note: null, rejection_reason: null,
        processed_by: null, processed_at: null,
        approved_at: null, completed_at: null,
        created_at: ago(hrs(2)),
      },
      // ── APPROVED ─────────────────────────────────────────────────────────
      {
        label: 'APPROVED',
        user_id: p2.user_id, wallet_id: p2.id,
        amount: 150.00, fee: 2.50, currency: p2.currency,
        withdrawal_address: addresses.TRC20,
        network: 'TRC20', payment_method: 'crypto',
        status: 'APPROVED',
        admin_note: 'Funds transferred manually via TRC20. TX confirmed.',
        rejection_reason: null,
        processed_by: adminId,
        processed_at: ago(hrs(5)),
        approved_at: ago(hrs(5)),
        completed_at: ago(hrs(5)),
        created_at: ago(hrs(6)),
      },
      // ── APPROVED — different network ─────────────────────────────────────
      {
        label: 'APPROVED (BEP20)',
        user_id: (picks[3] ?? p0).user_id, wallet_id: (picks[3] ?? p0).id,
        amount: 500.00, fee: 5.00, currency: (picks[3] ?? p0).currency,
        withdrawal_address: addresses.BEP20,
        network: 'BEP20', payment_method: 'crypto',
        status: 'APPROVED',
        admin_note: 'Processed via BEP20 — user confirmed receipt.',
        rejection_reason: null,
        processed_by: adminId,
        processed_at: ago(days(1)),
        approved_at: ago(days(1)),
        completed_at: ago(days(1)),
        created_at: ago(days(1) + hrs(2)),
      },
      // ── REJECTED ─────────────────────────────────────────────────────────
      {
        label: 'REJECTED (invalid address)',
        user_id: (picks[4] ?? p1).user_id, wallet_id: (picks[4] ?? p1).id,
        amount: 300.00, fee: 3.00, currency: (picks[4] ?? p1).currency,
        withdrawal_address: 'INVALID_ADDR_0xBAD',
        network: 'ERC20', payment_method: 'crypto',
        status: 'REJECTED',
        admin_note: 'Address did not pass validation checks.',
        rejection_reason: 'The provided ERC20 address is invalid. Please submit a correct wallet address.',
        processed_by: adminId,
        processed_at: ago(hrs(10)),
        approved_at: null,
        completed_at: null,
        created_at: ago(hrs(12)),
      },
      // ── REJECTED — insufficient KYC ──────────────────────────────────────
      {
        label: 'REJECTED (KYC)',
        user_id: p0.user_id, wallet_id: p0.id,
        amount: 1000.00, fee: 10.00, currency: p0.currency,
        withdrawal_address: addresses.BTC,
        network: 'BTC', payment_method: 'crypto',
        status: 'REJECTED',
        admin_note: 'Account KYC not completed for large withdrawals.',
        rejection_reason: 'Withdrawals above 500 USDT require completed KYC verification.',
        processed_by: adminId,
        processed_at: ago(days(2)),
        approved_at: null,
        completed_at: null,
        created_at: ago(days(2) + hrs(1)),
      },
    ];

    // ── 6. Insert ──────────────────────────────────────────────────────────
    await client.query('BEGIN');

    let inserted = 0;
    for (const s of seeds) {
      await client.query(
        `INSERT INTO withdrawals
           (user_id, wallet_id, amount, fee, currency, payment_method,
            withdrawal_address, network, status, admin_note, rejection_reason,
            processed_by, processed_at, approved_at, completed_at, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
        [
          s.user_id, s.wallet_id, s.amount, s.fee,
          s.currency, s.payment_method, s.withdrawal_address, s.network,
          s.status, s.admin_note, s.rejection_reason,
          s.processed_by, s.processed_at, s.approved_at, s.completed_at,
          s.created_at,
        ]
      );
      console.log(`✅ ${s.label} — ${s.amount} ${s.currency} (user: ${s.user_id.slice(0, 8)}…)`);
      inserted++;
    }

    await client.query('COMMIT');
    console.log(`\n✨ Done — ${inserted} withdrawal records seeded.`);

  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('\n❌ Seed failed:', err.message);
    console.error(err);
    throw err;
  } finally {
    client.release();
    await pool.end();
    console.log('🛑 DB connection closed.');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedWithdrawals()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default seedWithdrawals;
