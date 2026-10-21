-- Migration: 023_create_trade_transaction_archival_tables
-- Description: Create archival tables for binary trades and transactions
-- Phase 3 of Database Performance Improvements

-- ============================================================================
-- ARCHIVAL TABLE: binary_trades_archive
-- ============================================================================
-- Stores archived binary trades older than 24 months
-- Retention: 7 years total (24 months main + 5 years archive)

CREATE TABLE IF NOT EXISTS binary_trades_archive (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    pair VARCHAR(20) NOT NULL,
    direction VARCHAR(10) NOT NULL,
    amount NUMERIC(28,8) NOT NULL,
    duration INT NOT NULL,
    entry_price NUMERIC(28,8) NOT NULL,
    close_price NUMERIC(28,8),
    payout NUMERIC(28,8),
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    resolved_at TIMESTAMPTZ,
    archived_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for archived trade queries
CREATE INDEX IF NOT EXISTS idx_binary_trades_archive_user_created 
ON binary_trades_archive(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_binary_trades_archive_status 
ON binary_trades_archive(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_binary_trades_archive_pair 
ON binary_trades_archive(pair, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_binary_trades_archive_archived 
ON binary_trades_archive(archived_at DESC);

COMMENT ON TABLE binary_trades_archive IS 'Archived binary trades older than 24 months (7 year total retention)';

-- ============================================================================
-- ARCHIVAL TABLE: transactions_archive
-- ============================================================================
-- Stores archived transactions older than 36 months
-- Retention: 7 years total (36 months main + 4 years archive)

CREATE TABLE IF NOT EXISTS transactions_archive (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    wallet_id UUID NOT NULL,
    type VARCHAR(50) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    amount NUMERIC(28,8) NOT NULL,
    fee NUMERIC(28,8) NOT NULL DEFAULT 0.00000000,
    status VARCHAR(20) NOT NULL,
    confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL,
    archived_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for archived transaction queries
CREATE INDEX IF NOT EXISTS idx_transactions_archive_user_created 
ON transactions_archive(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_archive_status 
ON transactions_archive(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_archive_type 
ON transactions_archive(type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_archive_archived 
ON transactions_archive(archived_at DESC);

COMMENT ON TABLE transactions_archive IS 'Archived transactions older than 36 months (7 year total retention)';

-- ============================================================================
-- ARCHIVAL TABLE: withdrawals_archive
-- ============================================================================
-- Stores archived withdrawals older than 24 months
-- Retention: 7 years total (24 months main + 5 years archive)

CREATE TABLE IF NOT EXISTS withdrawals_archive (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    wallet_id UUID NOT NULL,
    amount DECIMAL(18,8) NOT NULL,
    fee DECIMAL(18,8) DEFAULT 0,
    currency VARCHAR(20) NOT NULL,
    payment_method VARCHAR(50),
    withdrawal_address TEXT,
    network VARCHAR(50),
    status VARCHAR(20) NOT NULL,
    admin_note TEXT,
    rejection_reason TEXT,
    processed_by UUID,
    processed_at TIMESTAMP,
    approved_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL,
    archived_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for archived withdrawal queries
CREATE INDEX IF NOT EXISTS idx_withdrawals_archive_user_created 
ON withdrawals_archive(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_withdrawals_archive_status 
ON withdrawals_archive(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_withdrawals_archive_archived 
ON withdrawals_archive(archived_at DESC);

COMMENT ON TABLE withdrawals_archive IS 'Archived withdrawals older than 24 months (7 year total retention)';
