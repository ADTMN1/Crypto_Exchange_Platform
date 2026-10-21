import cron from 'node-cron';
import { query } from '../config/db.config.js';

/**
 * Database Archival Job
 * 
 * Phase 2: Archival for high-growth logging tables
 * - audit_logs: Archive records older than 12 months
 * - notification_recipients: Archive records older than 6 months
 * 
 * Runs daily at 2:00 AM UTC
 */

const ARCHIVAL_CONFIG = {
    audit_logs: {
        retention_months: 12,
        batch_size: 10000,
    },
    notification_recipients: {
        retention_months: 6,
        batch_size: 5000,
    },
    binary_trades: {
        retention_months: 24,
        batch_size: 5000,
    },
    transactions: {
        retention_months: 36,
        batch_size: 10000,
    },
    withdrawals: {
        retention_months: 24,
        batch_size: 5000,
    },
};

/**
 * Archive audit logs older than retention period
 */
async function archiveAuditLogs() {
    console.log('🗂️ [Archival] Starting audit log archival...');
    
    const retentionDate = new Date();
    retentionDate.setMonth(retentionDate.getMonth() - ARCHIVAL_CONFIG.audit_logs.retention_months);
    
    let archivedCount = 0;
    let hasMore = true;
    
    try {
        while (hasMore) {
            // Move records to archive table
            const result = await query(`
                WITH archived AS (
                    DELETE FROM audit_logs
                    WHERE created_at < $1
                    RETURNING id, user_id, action, entity_type, entity_id, ip_address, metadata, created_at
                )
                INSERT INTO audit_logs_archive 
                (id, user_id, action, entity_type, entity_id, ip_address, metadata, created_at, archived_at)
                SELECT id, user_id, action, entity_type, entity_id, ip_address, metadata, created_at, CURRENT_TIMESTAMP
                FROM archived
                RETURNING id
            `, [retentionDate]);
            
            archivedCount += result.rowCount;
            hasMore = result.rowCount >= ARCHIVAL_CONFIG.audit_logs.batch_size;
            
            if (result.rowCount > 0) {
                console.log(`🗂️ [Archival] Archived ${result.rowCount} audit logs (total: ${archivedCount})`);
            }
            
            // Small delay between batches to avoid overwhelming the database
            if (hasMore) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
        
        console.log(`✅ [Archival] Audit log archival complete: ${archivedCount} records archived`);
        return archivedCount;
    } catch (error) {
        console.error('❌ [Archival] Audit log archival failed:', error.message);
        throw error;
    }
}

/**
 * Archive notification recipients older than retention period
 */
async function archiveNotificationRecipients() {
    console.log('🗂️ [Archival] Starting notification recipient archival...');
    
    const retentionDate = new Date();
    retentionDate.setMonth(retentionDate.getMonth() - ARCHIVAL_CONFIG.notification_recipients.retention_months);
    
    let archivedCount = 0;
    let hasMore = true;
    
    try {
        while (hasMore) {
            // First, archive notification content if not already archived
            await query(`
                INSERT INTO notifications_archive (id, type, title, body, metadata, created_at, archived_at)
                SELECT n.id, n.type, n.title, n.body, n.metadata, n.created_at, CURRENT_TIMESTAMP
                FROM notifications n
                WHERE n.id IN (
                    SELECT DISTINCT nr.notification_id
                    FROM notification_recipients nr
                    WHERE nr.created_at < $1
                )
                AND NOT EXISTS (
                    SELECT 1 FROM notifications_archive na WHERE na.id = n.id
                )
                ON CONFLICT (id) DO NOTHING
            `, [retentionDate]);
            
            // Move recipients to archive table
            const result = await query(`
                WITH archived AS (
                    DELETE FROM notification_recipients
                    WHERE created_at < $1
                    RETURNING id, notification_id, user_id, is_read, read_at, created_at
                )
                INSERT INTO notification_recipients_archive 
                (id, notification_id, user_id, is_read, read_at, created_at, archived_at)
                SELECT id, notification_id, user_id, is_read, read_at, created_at, CURRENT_TIMESTAMP
                FROM archived
                RETURNING id
            `, [retentionDate]);
            
            archivedCount += result.rowCount;
            hasMore = result.rowCount >= ARCHIVAL_CONFIG.notification_recipients.batch_size;
            
            if (result.rowCount > 0) {
                console.log(`🗂️ [Archival] Archived ${result.rowCount} notification recipients (total: ${archivedCount})`);
            }
            
            // Small delay between batches
            if (hasMore) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
        
        console.log(`✅ [Archival] Notification recipient archival complete: ${archivedCount} records archived`);
        return archivedCount;
    } catch (error) {
        console.error('❌ [Archival] Notification recipient archival failed:', error.message);
        throw error;
    }
}

/**
 * Archive binary trades older than retention period
 */
async function archiveBinaryTrades() {
    console.log('🗂️ [Archival] Starting binary trade archival...');
    
    const retentionDate = new Date();
    retentionDate.setMonth(retentionDate.getMonth() - ARCHIVAL_CONFIG.binary_trades.retention_months);
    
    let archivedCount = 0;
    let hasMore = true;
    
    try {
        while (hasMore) {
            const result = await query(`
                WITH archived AS (
                    DELETE FROM binary_trades
                    WHERE created_at < $1
                    RETURNING id, user_id, pair, direction, amount, duration, entry_price, 
                             close_price, payout, status, created_at, expires_at, resolved_at
                )
                INSERT INTO binary_trades_archive 
                (id, user_id, pair, direction, amount, duration, entry_price, close_price, 
                 payout, status, created_at, expires_at, resolved_at, archived_at)
                SELECT id, user_id, pair, direction, amount, duration, entry_price, close_price, 
                       payout, status, created_at, expires_at, resolved_at, CURRENT_TIMESTAMP
                FROM archived
                RETURNING id
            `, [retentionDate]);
            
            archivedCount += result.rowCount;
            hasMore = result.rowCount >= ARCHIVAL_CONFIG.binary_trades.batch_size;
            
            if (result.rowCount > 0) {
                console.log(`🗂️ [Archival] Archived ${result.rowCount} binary trades (total: ${archivedCount})`);
            }
            
            if (hasMore) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
        
        console.log(`✅ [Archival] Binary trade archival complete: ${archivedCount} records archived`);
        return archivedCount;
    } catch (error) {
        console.error('❌ [Archival] Binary trade archival failed:', error.message);
        throw error;
    }
}

/**
 * Archive transactions older than retention period
 */
async function archiveTransactions() {
    console.log('🗂️ [Archival] Starting transaction archival...');
    
    const retentionDate = new Date();
    retentionDate.setMonth(retentionDate.getMonth() - ARCHIVAL_CONFIG.transactions.retention_months);
    
    let archivedCount = 0;
    let hasMore = true;
    
    try {
        while (hasMore) {
            const result = await query(`
                WITH archived AS (
                    DELETE FROM transactions
                    WHERE created_at < $1
                    RETURNING id, user_id, wallet_id, type, currency, amount, fee, status, confirmed_at, created_at
                )
                INSERT INTO transactions_archive 
                (id, user_id, wallet_id, type, currency, amount, fee, status, confirmed_at, created_at, archived_at)
                SELECT id, user_id, wallet_id, type, currency, amount, fee, status, confirmed_at, created_at, CURRENT_TIMESTAMP
                FROM archived
                RETURNING id
            `, [retentionDate]);
            
            archivedCount += result.rowCount;
            hasMore = result.rowCount >= ARCHIVAL_CONFIG.transactions.batch_size;
            
            if (result.rowCount > 0) {
                console.log(`🗂️ [Archival] Archived ${result.rowCount} transactions (total: ${archivedCount})`);
            }
            
            if (hasMore) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
        
        console.log(`✅ [Archival] Transaction archival complete: ${archivedCount} records archived`);
        return archivedCount;
    } catch (error) {
        console.error('❌ [Archival] Transaction archival failed:', error.message);
        throw error;
    }
}

/**
 * Archive withdrawals older than retention period
 */
async function archiveWithdrawals() {
    console.log('🗂️ [Archival] Starting withdrawal archival...');
    
    const retentionDate = new Date();
    retentionDate.setMonth(retentionDate.getMonth() - ARCHIVAL_CONFIG.withdrawals.retention_months);
    
    let archivedCount = 0;
    let hasMore = true;
    
    try {
        while (hasMore) {
            const result = await query(`
                WITH archived AS (
                    DELETE FROM withdrawals
                    WHERE created_at < $1
                    RETURNING id, user_id, wallet_id, amount, fee, currency, payment_method, 
                             withdrawal_address, network, status, admin_note, rejection_reason,
                             processed_by, processed_at, approved_at, completed_at, created_at
                )
                INSERT INTO withdrawals_archive 
                (id, user_id, wallet_id, amount, fee, currency, payment_method, withdrawal_address, 
                 network, status, admin_note, rejection_reason, processed_by, processed_at, 
                 approved_at, completed_at, created_at, archived_at)
                SELECT id, user_id, wallet_id, amount, fee, currency, payment_method, withdrawal_address, 
                       network, status, admin_note, rejection_reason, processed_by, processed_at, 
                       approved_at, completed_at, created_at, CURRENT_TIMESTAMP
                FROM archived
                RETURNING id
            `, [retentionDate]);
            
            archivedCount += result.rowCount;
            hasMore = result.rowCount >= ARCHIVAL_CONFIG.withdrawals.batch_size;
            
            if (result.rowCount > 0) {
                console.log(`🗂️ [Archival] Archived ${result.rowCount} withdrawals (total: ${archivedCount})`);
            }
            
            if (hasMore) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
        
        console.log(`✅ [Archival] Withdrawal archival complete: ${archivedCount} records archived`);
        return archivedCount;
    } catch (error) {
        console.error('❌ [Archival] Withdrawal archival failed:', error.message);
        throw error;
    }
}

/**
 * Run all archival jobs
 */
async function runArchival() {
    console.log('🗂️ [Archival] ====== Starting archival job ======');
    console.log(`🗂️ [Archival] Retention periods:`);
    console.log(`🗂️ [Archival]   - Audit logs: ${ARCHIVAL_CONFIG.audit_logs.retention_months} months`);
    console.log(`🗂️ [Archival]   - Notification recipients: ${ARCHIVAL_CONFIG.notification_recipients.retention_months} months`);
    console.log(`🗂️ [Archival]   - Binary trades: ${ARCHIVAL_CONFIG.binary_trades.retention_months} months`);
    console.log(`🗂️ [Archival]   - Transactions: ${ARCHIVAL_CONFIG.transactions.retention_months} months`);
    console.log(`🗂️ [Archival]   - Withdrawals: ${ARCHIVAL_CONFIG.withdrawals.retention_months} months`);
    
    try {
        const auditLogsArchived = await archiveAuditLogs();
        const notificationsArchived = await archiveNotificationRecipients();
        const binaryTradesArchived = await archiveBinaryTrades();
        const transactionsArchived = await archiveTransactions();
        const withdrawalsArchived = await archiveWithdrawals();
        
        const totalArchived = auditLogsArchived + notificationsArchived + binaryTradesArchived + transactionsArchived + withdrawalsArchived;
        
        console.log('🗂️ [Archival] ====== Archival job complete ======');
        console.log(`🗂️ [Archival] Total records archived: ${totalArchived}`);
        
        return {
            auditLogs: auditLogsArchived,
            notifications: notificationsArchived,
            binaryTrades: binaryTradesArchived,
            transactions: transactionsArchived,
            withdrawals: withdrawalsArchived,
            total: totalArchived,
        };
    } catch (error) {
        console.error('🗂️ [Archival] Archival job failed:', error.message);
        throw error;
    }
}

/**
 * Start archival cron job
 * Runs daily at 2:00 AM UTC
 */
export function startArchivalJob() {
    console.log('🗂️ [Archival] Scheduling archival job (daily at 2:00 AM UTC)');
    
    // Run daily at 2:00 AM UTC
    cron.schedule('0 2 * * *', async () => {
        try {
            await runArchival();
        } catch (error) {
            console.error('🗂️ [Archival] Scheduled archival job failed:', error.message);
        }
    }, {
        timezone: 'UTC'
    });
}

/**
 * Manual archival trigger (for testing or immediate execution)
 */
export { runArchival };
