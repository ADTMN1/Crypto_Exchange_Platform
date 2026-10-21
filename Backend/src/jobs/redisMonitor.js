import cron from 'node-cron';
import redisClient from '../config/redis.config.js';
import logger from '../utils/logger.js';

/**
 * Redis Memory Monitoring Job
 * 
 * Monitors Redis memory usage and alerts when thresholds are exceeded
 * Runs every 5 minutes
 */

const MEMORY_THRESHOLD_WARNING = 80; // 80% of maxmemory
const MEMORY_THRESHOLD_CRITICAL = 90; // 90% of maxmemory
const MEMORY_THRESHOLD_EMERGENCY = 95; // 95% of maxmemory

/**
 * Get Redis memory information
 */
async function getRedisMemoryInfo() {
    try {
        const info = await redisClient.info('memory');
        const lines = info.split('\r\n');
        const memoryData = {};
        
        for (const line of lines) {
            if (line.includes(':')) {
                const [key, value] = line.split(':');
                memoryData[key] = value;
            }
        }
        
        return {
            used_memory: parseInt(memoryData['used_memory'] || 0),
            used_memory_human: memoryData['used_memory_human'] || '0B',
            used_memory_peak: parseInt(memoryData['used_memory_peak'] || 0),
            used_memory_peak_human: memoryData['used_memory_peak_human'] || '0B',
            used_memory_rss: parseInt(memoryData['used_memory_rss'] || 0),
            used_memory_rss_human: memoryData['used_memory_rss_human'] || '0B',
            maxmemory: parseInt(memoryData['maxmemory'] || 0),
            maxmemory_human: memoryData['maxmemory_human'] || '0B',
            maxmemory_policy: memoryData['maxmemory-policy'] || 'noeviction',
            mem_fragmentation_ratio: parseFloat(memoryData['mem_fragmentation_ratio'] || 1),
            expired_keys: parseInt(memoryData['expired_keys'] || 0),
            evicted_keys: parseInt(memoryData['evicted_keys'] || 0),
            rejected_connections: parseInt(memoryData['rejected_connections'] || 0),
            keyspace_hits: parseInt(memoryData['keyspace_hits'] || 0),
            keyspace_misses: parseInt(memoryData['keyspace_misses'] || 0),
        };
    } catch (error) {
        logger.error('Failed to get Redis memory info', { error: error.message });
        return null;
    }
}

/**
 * Get Redis key count
 */
async function getRedisKeyCount() {
    try {
        const info = await redisClient.info('keyspace');
        const lines = info.split('\r\n');
        let totalKeys = 0;
        
        for (const line of lines) {
            if (line.startsWith('db')) {
                const match = line.match(/keys=(\d+)/);
                if (match) {
                    totalKeys += parseInt(match[1]);
                }
            }
        }
        
        return totalKeys;
    } catch (error) {
        logger.error('Failed to get Redis key count', { error: error.message });
        return 0;
    }
}

/**
 * Run Redis memory monitoring
 */
async function runRedisMonitoring() {
    logger.info('Starting Redis memory monitoring');
    
    const memoryInfo = await getRedisMemoryInfo();
    if (!memoryInfo) {
        logger.error('Redis memory monitoring failed - could not get memory info');
        return;
    }
    
    const keyCount = await getRedisKeyCount();
    
    // Calculate memory usage percentage
    let memoryUsagePercent = 0;
    if (memoryInfo.maxmemory > 0) {
        memoryUsagePercent = (memoryInfo.used_memory / memoryInfo.maxmemory) * 100;
    }
    
    // Determine status
    let status = '✅ OK';
    if (memoryUsagePercent >= MEMORY_THRESHOLD_EMERGENCY) {
        status = '🚨 EMERGENCY';
    } else if (memoryUsagePercent >= MEMORY_THRESHOLD_CRITICAL) {
        status = '🔴 CRITICAL';
    } else if (memoryUsagePercent >= MEMORY_THRESHOLD_WARNING) {
        status = '⚠️ WARNING';
    }
    
    logger.info('Redis memory status', {
        status,
        used_memory: memoryInfo.used_memory_human,
        max_memory: memoryInfo.maxmemory_human || 'unlimited',
        usage_percent: memoryUsagePercent.toFixed(2),
        peak_memory: memoryInfo.used_memory_peak_human,
        fragmentation_ratio: memoryInfo.mem_fragmentation_ratio.toFixed(2),
        total_keys: keyCount,
        expired_keys: memoryInfo.expired_keys,
        evicted_keys: memoryInfo.evicted_keys,
        rejected_connections: memoryInfo.rejected_connections,
        maxmemory_policy: memoryInfo.maxmemory_policy,
    });
    
    // Alert if memory usage is high
    if (memoryUsagePercent >= MEMORY_THRESHOLD_EMERGENCY) {
        logger.error('EMERGENCY: Redis memory usage is critically high - immediate action required', {
            usage_percent: memoryUsagePercent.toFixed(2),
            used_memory: memoryInfo.used_memory_human,
            max_memory: memoryInfo.maxmemory_human,
            evicted_keys: memoryInfo.evicted_keys,
        });
    } else if (memoryUsagePercent >= MEMORY_THRESHOLD_CRITICAL) {
        logger.error('CRITICAL: Redis memory usage is critically high', {
            usage_percent: memoryUsagePercent.toFixed(2),
            used_memory: memoryInfo.used_memory_human,
            max_memory: memoryInfo.maxmemory_human,
        });
    } else if (memoryUsagePercent >= MEMORY_THRESHOLD_WARNING) {
        logger.warn('WARNING: Redis memory usage is high', {
            usage_percent: memoryUsagePercent.toFixed(2),
            used_memory: memoryInfo.used_memory_human,
            max_memory: memoryInfo.maxmemory_human,
        });
    }
    
    // Alert if eviction is happening
    if (memoryInfo.evicted_keys > 0) {
        logger.warn('Redis has evicted keys due to memory pressure', { evicted_keys: memoryInfo.evicted_keys });
    }
    
    // Alert if connections are being rejected
    if (memoryInfo.rejected_connections > 0) {
        logger.error('Redis is rejecting connections', { rejected_connections: memoryInfo.rejected_connections });
    }
    
    // Alert if fragmentation is high (> 1.5)
    if (memoryInfo.mem_fragmentation_ratio > 1.5) {
        logger.warn('Redis memory fragmentation is high', {
            fragmentation_ratio: memoryInfo.mem_fragmentation_ratio.toFixed(2),
        });
    }
    
    return {
        memoryInfo,
        keyCount,
        memoryUsagePercent,
        status,
    };
}

/**
 * Start Redis monitoring cron job
 * Runs every 5 minutes
 */
export function startRedisMonitoring() {
    logger.info('Scheduling Redis memory monitoring (every 5 minutes)');
    
    cron.schedule('*/5 * * * *', async () => {
        try {
            await runRedisMonitoring();
        } catch (error) {
            logger.error('Redis monitoring job failed', { error: error.message });
        }
    });
}

/**
 * Manual monitoring trigger (for testing or immediate execution)
 */
export { runRedisMonitoring };
