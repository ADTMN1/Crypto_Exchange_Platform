-- ============================================================================
-- CRYPTO EXCHANGE SYSTEM COMPLETE DATABASE SCHEMA (PostgreSQL DDL)
-- ============================================================================

-- Enable pgcrypto extension for automatic UUID generation if needed
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Clean drop tables if they exist (Reverse dependency order)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS candles CASCADE;
DROP TABLE IF EXISTS trades CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS trading_pairs CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS wallets CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS user_status CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Clean drop existing custom ENUM types to prevent duplicate creation errors
DROP TYPE IF EXISTS order_status_enum CASCADE;
DROP TYPE IF EXISTS order_side_enum CASCADE;
DROP TYPE IF EXISTS order_type_enum CASCADE;
DROP TYPE IF EXISTS transaction_status_enum CASCADE;
DROP TYPE IF EXISTS transaction_type_enum CASCADE;
DROP TYPE IF EXISTS account_status_enum CASCADE;

-- ============================================================================
-- 🛠️ CREATE NATIVE ENUM TYPES
-- ============================================================================

CREATE TYPE account_status_enum AS ENUM ('pending', 'active', 'suspended', 'banned');
CREATE TYPE transaction_type_enum AS ENUM ('deposit', 'withdrawal');
CREATE TYPE transaction_status_enum AS ENUM ('pending', 'completed', 'failed');
CREATE TYPE order_type_enum AS ENUM ('market', 'limit');
CREATE TYPE order_side_enum AS ENUM ('buy', 'sell');
CREATE TYPE order_status_enum AS ENUM ('open', 'partially_filled', 'filled', 'cancelled');

-- ============================================================================
-- 🧱 DATABASE LAYOUT TABLES
-- ============================================================================

-- 🔐 1. Roles Table
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(20) NOT NULL UNIQUE, -- admin, user, trader, support
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 🧑‍💻 2. Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(50) NOT NULL UNIQUE,
    role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
    phone_number VARCHAR(20) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMPTZ
);

-- 🔒 3. User Status Table (Uses account_status_enum)
CREATE TABLE user_status (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    account_status account_status_enum NOT NULL DEFAULT 'pending',
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
    two_fa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 🔐 4. Sessions Table
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 💰 5. Wallets Table
CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    currency VARCHAR(10) NOT NULL, -- BTC, ETH, USDT
    balance NUMERIC(28,8) NOT NULL DEFAULT 0.00000000,
    locked_balance NUMERIC(28,8) NOT NULL DEFAULT 0.00000000,
    deposit_address TEXT,
    address_key_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_currency UNIQUE (user_id, currency)
);

-- 💸 6. Transactions Table (Uses transaction_type_enum and transaction_status_enum)
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE RESTRICT,
    type transaction_type_enum NOT NULL,
    currency VARCHAR(10) NOT NULL,
    amount NUMERIC(28,8) NOT NULL,
    fee NUMERIC(28,8) NOT NULL DEFAULT 0.00000000,
    status transaction_status_enum NOT NULL DEFAULT 'pending',
    tx_hash TEXT,
    from_address TEXT,
    to_address TEXT,
    confirmations INT NOT NULL DEFAULT 0,
    confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 📊 7. Trading Pairs Table
CREATE TABLE trading_pairs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    base_currency VARCHAR(10) NOT NULL, -- BTC
    quote_currency VARCHAR(10) NOT NULL, -- USDT
    min_order_size NUMERIC(28,8) NOT NULL,
    max_order_size NUMERIC(28,8) NOT NULL,
    price_precision INT NOT NULL DEFAULT 8,
    qty_precision INT NOT NULL DEFAULT 8,
    maker_fee NUMERIC(6,4) NOT NULL DEFAULT 0.0000,
    taker_fee NUMERIC(6,4) NOT NULL DEFAULT 0.0000,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT unique_market_pair UNIQUE (base_currency, quote_currency)
);

-- 📈 8. Orders Table (Uses order_type_enum, order_side_enum, and order_status_enum)
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    pair_id UUID NOT NULL REFERENCES trading_pairs(id) ON DELETE RESTRICT,
    type order_type_enum NOT NULL,
    side order_side_enum NOT NULL,
    status order_status_enum NOT NULL DEFAULT 'open',
    price NUMERIC(28,8),
    stop_price NUMERIC(28,8),
    quantity NUMERIC(28,8) NOT NULL,
    filled_qty NUMERIC(28,8) NOT NULL DEFAULT 0.00000000,
    avg_fill_price NUMERIC(28,8) NOT NULL DEFAULT 0.00000000,
    fee NUMERIC(28,8) NOT NULL DEFAULT 0.00000000,
    fee_currency VARCHAR(10),
    client_order_id VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    cancelled_at TIMESTAMPTZ
);

-- 🤝 9. Trades Table
CREATE TABLE trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pair_id UUID NOT NULL REFERENCES trading_pairs(id) ON DELETE RESTRICT,
    buy_order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    sell_order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    seller_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    price NUMERIC(28,8) NOT NULL,
    quantity NUMERIC(28,8) NOT NULL,
    buyer_fee NUMERIC(28,8) NOT NULL DEFAULT 0.00000000,
    seller_fee NUMERIC(28,8) NOT NULL DEFAULT 0.00000000,
    is_maker_buy BOOLEAN NOT NULL,
    executed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 📉 10. Candles Table
CREATE TABLE candles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pair_id UUID NOT NULL REFERENCES trading_pairs(id) ON DELETE CASCADE,
    interval VARCHAR(5) NOT NULL, -- 1m, 5m, 1h
    open NUMERIC(28,8) NOT NULL,
    high NUMERIC(28,8) NOT NULL,
    low NUMERIC(28,8) NOT NULL,
    close NUMERIC(28,8) NOT NULL,
    volume NUMERIC(28,8) NOT NULL,
    trade_count INT NOT NULL DEFAULT 0,
    timestamp TIMESTAMPTZ NOT NULL,
    CONSTRAINT unique_candle_bucket UNIQUE (pair_id, interval, timestamp)
);

-- 🧾 11. Audit Logs Table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(30) NOT NULL,
    entity_id UUID,
    ip_address INET,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 🔔 12. Notifications Table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL,
    title VARCHAR(100) NOT NULL,
    body TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- ⚡ OPTIMIZED PRODUCTION INDEXES
-- ============================================================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone_number);
CREATE INDEX idx_users_role ON users(role_id);

CREATE INDEX idx_sessions_user_revoked ON sessions(user_id, is_revoked);
CREATE INDEX idx_sessions_token ON sessions(refresh_token);

CREATE INDEX idx_wallets_user_currency ON wallets(user_id, currency);

CREATE INDEX idx_transactions_lookup ON transactions(user_id, status, tx_hash);

CREATE INDEX idx_orders_matching ON orders(pair_id, status);
CREATE INDEX idx_orders_user_history ON orders(user_id, pair_id, status, created_at DESC);

CREATE INDEX idx_trades_analytics ON trades(pair_id, buyer_id, seller_id, executed_at DESC);

CREATE INDEX idx_candles_aggregation ON candles(pair_id, interval, timestamp DESC);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, created_at DESC);

CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;