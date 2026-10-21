import cron from 'node-cron';
import { query } from '../config/db.config.js';

/**
 * Database Growth Monitoring Job
 * 
 * Monitors database table sizes and growth patterns
 * Runs daily at 3:00 AM UTC
 * Alerts when tables exceed size thresholds
 */

const SIZE_THRESHOLDS = {
    audit_logs: { warning_mb: 500, critical_mb: 1000 },
    notification_recipients: { warning_mb: 200, critical_mb: 500 },
    binary_trades: { warning_mb: 1000, critical_mb: 2000 },
    transactions: { warning_mb: 2000, critical_mb: 5000 },
    withdrawals: { warning_mb: 500, critical_mb: 1000 },
};

/**
 * Get table size in MB
 */
async function getTableSize(tableName) {
    const result = await query(`
        SELECT pg_size_pretty(pg_total_relation_size($1)) as size,
               pg_total_relation_size($1) as size_bytes
    `, [tableName]);
    
    return {
        size: result.rows[0].size,
        size_bytes: parseInt(result.rows[0].size_bytes),
        size_mb: parseInt(result.rows[0].size_bytes) / (1024 * 1024),
    };
}

/**
 * Get table row count
 */
async function getTableRowCount(tableName) {
    const result = await query(`SELECT COUNT(*) as count FROM ${tableName}`);
    return parseInt(result.rows[0].count);
}

/**
 * Monitor a single table
 */
async function monitorTable(tableName) {
    try {
        const size = await getTableSize(tableName);
        const count = await getTableRowCount(tableName);
        const threshold = SIZE_THRESHOLDS[tableName];
        
        let status = '✅ OK';
        if (threshold && size.size_mb >= threshold.critical_mb) {
            status = '🔴 CRITICAL';
        } else if (threshold && size.size_mb >= threshold.warning_mb) {
            status = '⚠️ WARNING';
        }
        
        return {
            table: tableName,
            size: size.size,
            size_mb: size.size_mb,
            row_count: count,
            status,
            threshold: threshold ? `${threshold.warning_mb}MB / ${threshold.critical_mb}MB` : 'N/A',
        };
    } catch (error) {
        return {
            table: tableName,
            status: '❌ ERROR',
            error: error.message,
        };
    }
}

/**
 * Run database monitoring
 */
async function runMonitoring() {
    console.log('📊 [DB Monitor] ====== Starting database monitoring ======');
    
    const tables = [
        'users',
        'wallets',
        'transactions',
        'withdrawals',
        'binary_trades',
        'audit_logs',
        'notification_recipients',
        'notifications',
        'support_tickets',
    ];
    
    const results = [];
    
    for (const table of tables) {
        const result = await monitorTable(table);
        results.push(result);
        
        console.log(`📊 [DB Monitor] ${table.padEnd(25)} ${result.status.padEnd(10)} Size: ${result.size?.padEnd(12)} Rows: ${result.row_count?.toLocaleString() || 'N/A'}`);
    }
    
    // Check for critical issues
    const criticalIssues = results.filter(r => r.status === '🔴 CRITICAL');
    const warnings = results.filter(r => r.status === '⚠️ WARNING');
    
    if (criticalIssues.length > 0) {
        console.log(`📊 [DB Monitor] 🔴 CRITICAL: ${criticalIssues.length} table(s) exceed critical size threshold`);
        console.log(`📊 [DB Monitor] Critical tables:`, criticalIssues.map(t => t.table).join(', '));
    }
    
    if (warnings.length > 0) {
        console.log(`📊 [DB Monitor] ⚠️ WARNING: ${warnings.length} table(s) exceed warning size threshold`);
        console.log(`📊 [DB Monitor] Warning tables:`, warnings.map(t => t.table).join(', '));
    }
    
    console.log('📊 [DB Monitor] ====== Monitoring complete ======');
    
    return {
        results,
        critical_count: criticalIssues.length,
        warning_count: warnings.length,
    };
}

/**
 * Start monitoring cron job
 * Runs daily at 3:00 AM UTC
 */
export function startDatabaseMonitoring() {
    console.log('📊 [DB Monitor] Scheduling database monitoring (daily at 3:00 AM UTC)');
    
    cron.schedule('0 3 * * *', async () => {
        try {
            await runMonitoring();
        } catch (error) {
            console.error('📊 [DB Monitor] Scheduled monitoring failed:', error.message);
        }
    }, {
        timezone: 'UTC'
    });
}

/**
 * Manual monitoring trigger (for testing or immediate execution)
 */
export { runMonitoring };
