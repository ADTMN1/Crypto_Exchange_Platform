# Read Replica Architecture for 10k+ Users

**Document Version:** 1.0
**Last Updated:** 2026-07-22
**Target Scale:** 10,000 - 100,000 users

---

## Executive Summary

As the Prime Alfa Trade platform scales beyond 10,000 users, the single database architecture will become a bottleneck. This document outlines a read replica architecture to handle increased read load while maintaining data consistency and high availability.

**Current State:** Single PostgreSQL database (Neon)
**Target State:** 1 Primary + 2-3 Read Replicas
**Expected Improvement:** 3-5x read throughput, reduced primary database load

---

## Architecture Overview

### Current Architecture (Single Database)

```
┌─────────────┐
│   Backend   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Primary DB │ (Neon PostgreSQL)
└─────────────┘
```

**Limitations:**
- All reads and writes hit the same database
- No read scalability
- Single point of failure
- Limited to ~10,000 concurrent users

### Target Architecture (Read Replicas)

```
┌─────────────┐
│   Backend   │
└──────┬──────┘
       │
       ├───► ┌─────────────┐ (Reads: User data, history, analytics)
       │     │ Replica 1   │
       │     └─────────────┘
       │
       ├───► ┌─────────────┐ (Reads: Market data, notifications)
       │     │ Replica 2   │
       │     └─────────────┘
       │
       └───► ┌─────────────┐ (Reads: Admin reports, audit logs)
             │ Replica 3   │ (Optional for 100k+ users)
             └─────────────┘
       │
       ▼
┌─────────────┐ (Writes: All write operations)
│  Primary DB │ (Neon PostgreSQL)
└─────────────┘
```

**Benefits:**
- Read operations distributed across replicas
- Primary database handles writes only
- Improved query performance
- High availability (replica can be promoted to primary)
- Geographic distribution (replicas in different regions)

---

## Implementation Strategy

### Phase 1: Database Configuration (Neon)

Neon supports read replicas natively. Configuration steps:

1. **Enable Read Replicas in Neon Console**
   - Go to Neon Dashboard → Project → Branches
   - Add read replica branch
   - Configure replica count (start with 2)

2. **Obtain Replica Connection Strings**
   - Each replica has its own connection string
   - Format: `postgresql://user:password@replica-host/database`

3. **Configure Replication Lag Monitoring**
   - Neon provides replication lag metrics
   - Set alert threshold: < 1 second lag

### Phase 2: Application Configuration

**File:** `src/config/db.config.js`

```javascript
import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

// Primary database (writes)
const primaryPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
});

// Read replica pool (reads)
const replicaPool = new Pool({
  connectionString: process.env.DATABASE_REPLICA_URL || process.env.DATABASE_URL,
  max: 30,
});

// Query function for writes (primary)
export const queryWrite = async (text, params) => {
  const start = Date.now();
  try {
    const res = await primaryPool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'production') {
      console.log('Executed query', { text, duration, rows: res.rowCount });
    }
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// Query function for reads (replica)
export const queryRead = async (text, params) => {
  const start = Date.now();
  try {
    const res = await replicaPool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'production') {
      console.log('Executed read query', { text, duration, rows: res.rowCount });
    }
    return res;
  } catch (error) {
    console.error('Database read query error:', error);
    // Fallback to primary on replica failure
    console.log('Falling back to primary database for read');
    return primaryPool.query(text, params);
  }
};

// Legacy query function (default to read)
export const query = queryRead;

// Export pools for direct access
export { primaryPool, replicaPool };
```

**Environment Variables (.env)**
```bash
DATABASE_URL=postgresql://primary-host/database
DATABASE_REPLICA_URL=postgresql://replica-host/database
```

### Phase 3: Service Layer Updates

Update services to use `queryWrite` for write operations and `queryRead` for read operations.

**Example: wallet.service.js**

```javascript
import { queryWrite, queryRead } from '../config/db.config.js';

// Write operation (use primary)
const walletService = {
  add: async (userId, amount, type, client = null) => {
    const queryFn = client || queryWrite;
    await queryFn(
      `UPDATE wallets SET balance = balance + $1 WHERE user_id = $2 AND currency = 'USDT'`,
      [amount, userId]
    );
  },

  // Read operation (use replica)
  getBalance: async (userId) => {
    const result = await queryRead(
      `SELECT currency, balance, locked_balance FROM wallets WHERE user_id = $1`,
      [userId]
    );
    return result.rows;
  },
};
```

**Service Classification:**

**Write Operations (use `queryWrite`):**
- User registration
- Trade creation
- Wallet updates (add, subtract, lock, release)
- Transaction creation
- Withdrawal creation/approval
- Settings updates
- Audit log creation

**Read Operations (use `queryRead`):**
- User profile lookup
- Wallet balance queries
- Transaction history
- Trade history
- Market data queries
- Notification fetching
- Audit log queries
- Admin reports

### Phase 4: Connection Pool Tuning

**Primary Database (Writes):**
- Max connections: 20
- Idle timeout: 30 seconds
- Connection timeout: 10 seconds

**Replica Database (Reads):**
- Max connections: 30 (higher for read load)
- Idle timeout: 30 seconds
- Connection timeout: 10 seconds

---

## Query Routing Strategy

### Automatic Routing

Create a query router that automatically routes queries based on SQL keywords:

```javascript
// src/config/queryRouter.js
import { queryWrite, queryRead } from './db.config.js';

export const query = (text, params) => {
  const upperText = text.toUpperCase();
  
  // Write operations
  if (upperText.includes('INSERT') || 
      upperText.includes('UPDATE') || 
      upperText.includes('DELETE') ||
      upperText.includes('CREATE') ||
      upperText.includes('ALTER') ||
      upperText.includes('DROP')) {
    return queryWrite(text, params);
  }
  
  // Read operations
  return queryRead(text, params);
};
```

### Manual Routing

For critical operations, use explicit routing:

```javascript
import { queryWrite, queryRead } from '../config/db.config.js';

// Explicit write
await queryWrite('UPDATE wallets SET balance = balance + $1 WHERE user_id = $2', [amount, userId]);

// Explicit read
const result = await queryRead('SELECT * FROM users WHERE id = $1', [userId]);
```

---

## Replication Lag Considerations

### What is Replication Lag?

Replication lag is the delay between a write operation on the primary and when it appears on the replica.

**Acceptable Lag:** < 1 second
**Warning Threshold:** 1-5 seconds
**Critical Threshold:** > 5 seconds

### Handling Replication Lag

**Strategy 1: Eventual Consistency (Recommended)**
- Accept that reads may be slightly stale
- Suitable for: History queries, analytics, notifications
- Not suitable for: Immediate post-write reads

**Strategy 2: Read-After-Write Consistency**
- For critical operations, read from primary after write
- Example: After creating a trade, fetch trade details from primary

```javascript
// Write to primary
await queryWrite('INSERT INTO binary_trades ...', [params]);

// Immediately read from primary (not replica)
const trade = await queryWrite('SELECT * FROM binary_trades WHERE id = $1', [tradeId]);
```

**Strategy 3: Lag Monitoring**
- Monitor replication lag via Neon dashboard
- Alert if lag exceeds threshold
- Consider promoting replica if primary fails

---

## High Availability & Failover

### Replica Promotion

If the primary database fails, a replica can be promoted to primary:

1. **Automatic Promotion (Neon)**
   - Neon can automatically promote a replica
   - Configure in Neon dashboard
   - Typical failover time: 30-60 seconds

2. **Manual Promotion**
   - Use Neon CLI or dashboard
   - Update application connection string
   - Restart application

### Connection String Rotation

Implement connection string rotation for seamless failover:

```javascript
// src/config/db.config.js
const DATABASE_URLS = [
  process.env.DATABASE_URL,
  process.env.DATABASE_REPLICA_URL,
  process.env.DATABASE_REPLICA_URL_2,
];

let currentUrlIndex = 0;

export const getPool = () => {
  const url = DATABASE_URLS[currentUrlIndex];
  return new Pool({ connectionString: url });
};

export const rotateConnection = () => {
  currentUrlIndex = (currentUrlIndex + 1) % DATABASE_URLS.length;
};
```

---

## Performance Expectations

### Current Performance (Single Database)

- **Concurrent Users:** ~1,000-5,000
- **Read Queries/Second:** ~100-500
- **Write Queries/Second:** ~50-200
- **Average Query Time:** 20-50ms

### Expected Performance (1 Primary + 2 Replicas)

- **Concurrent Users:** ~10,000-50,000
- **Read Queries/Second:** ~1,000-5,000 (distributed across replicas)
- **Write Queries/Second:** ~200-500 (primary only)
- **Average Query Time:** 10-30ms (reads), 20-50ms (writes)

### Scaling to 100,000 Users

- **Configuration:** 1 Primary + 3-4 Replicas
- **Read Queries/Second:** ~5,000-10,000
- **Write Queries/Second:** ~500-1,000
- **Additional Optimizations:** 
  - Connection pooling (PgBouncer)
  - Query caching (Redis)
  - Geographic distribution

---

## Cost Analysis

### Neon Pricing (Estimates)

**Primary Database:**
- $0.50 per GB-month storage
- $0.10 per million read operations
- $0.20 per million write operations

**Read Replica:**
- $0.25 per GB-month storage (50% of primary)
- $0.05 per million read operations
- No write operations

**Estimated Monthly Cost (10k users):**
- Primary (100 GB): $50
- 2 Replicas (50 GB each): $25
- Read operations (10M): $0.50
- Write operations (2M): $0.40
- **Total:** ~$75/month

**Estimated Monthly Cost (100k users):**
- Primary (500 GB): $250
- 3 Replicas (250 GB each): $187.50
- Read operations (100M): $5
- Write operations (20M): $4
- **Total:** ~$446.50/month

---

## Migration Steps

### Step 1: Enable Replicas (Neon Console)
1. Go to Neon Dashboard
2. Add read replica branch
3. Configure replica count (start with 2)
4. Obtain replica connection strings

### Step 2: Update Application Configuration
1. Add `DATABASE_REPLICA_URL` to `.env`
2. Update `src/config/db.config.js` with replica pool
3. Implement `queryWrite` and `queryRead` functions

### Step 3: Update Service Layer
1. Identify write operations in services
2. Update to use `queryWrite`
3. Update read operations to use `queryRead`
4. Test in staging environment

### Step 4: Deploy to Production
1. Deploy configuration changes
2. Monitor replication lag
3. Monitor query performance
4. Scale replicas as needed

### Step 5: Monitor and Optimize
1. Set up alerts for replication lag
2. Monitor connection pool usage
3. Optimize slow queries
4. Add more replicas if needed

---

## Monitoring & Alerts

### Key Metrics to Monitor

**Replication Lag:**
- Metric: Replication lag in seconds
- Alert: > 1 second warning, > 5 seconds critical
- Tool: Neon Dashboard

**Connection Pool Usage:**
- Metric: Active connections / max connections
- Alert: > 80% usage
- Tool: Application logs

**Query Performance:**
- Metric: Average query time
- Alert: > 100ms for reads, > 200ms for writes
- Tool: Application logs

**Database Size:**
- Metric: Database size in GB
- Alert: > 80% of allocated storage
- Tool: Neon Dashboard

### Recommended Monitoring Tools

- **Neon Dashboard:** Built-in metrics
- **Datadog:** Application performance monitoring
- **New Relic:** Infrastructure monitoring
- **Prometheus + Grafana:** Open-source monitoring

---

## Rollback Plan

If issues occur with read replicas:

1. **Disable Replica Routing**
   - Set `DATABASE_REPLICA_URL` to same as `DATABASE_URL`
   - All queries go to primary
   - No code changes needed

2. **Remove Replicas**
   - Delete replicas in Neon console
   - No impact on primary database
   - Revert to single database architecture

3. **Restore Previous Configuration**
   - Revert `src/config/db.config.js` to single pool
   - Remove `queryWrite`/`queryRead` functions
   - Use single `query` function

---

## Conclusion

Implementing read replicas is a critical step for scaling beyond 10,000 users. The architecture provides:

- **Improved Performance:** 3-5x read throughput
- **High Availability:** Replica can be promoted to primary
- **Scalability:** Easy to add more replicas
- **Cost-Effective:** Linear cost scaling with user growth

**Recommended Timeline:**
- **Phase 1 (Now):** Enable 2 replicas in Neon
- **Phase 2 (1-2 weeks):** Update application configuration
- **Phase 3 (2-4 weeks):** Update service layer and deploy
- **Phase 4 (Ongoing):** Monitor and optimize

**Success Criteria:**
- Replication lag < 1 second
- Read query performance improved by 50%+
- Primary database load reduced by 60%+
- Zero data loss during failover
