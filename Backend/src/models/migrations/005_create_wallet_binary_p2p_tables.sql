-- ============================================================================
-- WALLET SYSTEM, BINARY TRADING & P2P TRADING TABLES
-- ============================================================================

-- Clean drop existing types and tables
DROP TABLE IF EXISTS p2p_orders CASCADE;
DROP TABLE IF EXISTS p2p_offers CASCADE;
DROP TABLE IF EXISTS binary_trades CASCADE;
DROP TYPE IF EXISTS p2p_offer_type_enum CASCADE;
DROP TYPE IF EXISTS p2p_order_status_enum CASCADE;
DROP TYPE IF EXISTS binary_direction_enum CASCADE;
DROP TYPE IF EXISTS binary_status_enum CASCADE;

-- ============================================================================
-- CREATE ENUM TYPES
-- ============================================================================

CREATE TYPE binary_direction_enum AS ENUM ('UP', 'DOWN');
CREATE TYPE binary_status_enum AS ENUM ('running', 'win', 'lose');
CREATE TYPE p2p_offer_type_enum AS ENUM ('buy', 'sell');
CREATE TYPE p2p_order_status_enum AS ENUM ('pending', 'paid', 'completed', 'cancelled', 'disputed');

-- ============================================================================
-- BINARY TRADES TABLE
-- ============================================================================

CREATE TABLE binary_trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    pair VARCHAR(20) NOT NULL, -- BTC/USDT, ETH/USDT
    direction binary_direction_enum NOT NULL,
    amount NUMERIC(28,8) NOT NULL,
    duration INT NOT NULL, -- in seconds
    entry_price NUMERIC(28,8) NOT NULL,
    close_price NUMERIC(28,8),
    status binary_status_enum NOT NULL DEFAULT 'running',
    payout NUMERIC(28,8) DEFAULT 0.00000000,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ NOT NULL,
    resolved_at TIMESTAMPTZ
);

-- ============================================================================
-- P2P OFFERS TABLE
-- ============================================================================

CREATE TABLE p2p_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    type p2p_offer_type_enum NOT NULL,
    crypto_currency VARCHAR(10) NOT NULL,
    fiat_currency VARCHAR(10) NOT NULL,
    price NUMERIC(28,8) NOT NULL, -- price per unit in fiat
    min_amount NUMERIC(28,8) NOT NULL,
    max_amount NUMERIC(28,8) NOT NULL,
    available_amount NUMERIC(28,8) NOT NULL,
    payment_methods TEXT, -- JSON string or comma-separated
    terms TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- P2P ORDERS TABLE
-- ============================================================================

CREATE TABLE p2p_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    offer_id UUID NOT NULL REFERENCES p2p_offers(id) ON DELETE RESTRICT,
    buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    seller_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    crypto_currency VARCHAR(10) NOT NULL,
    fiat_currency VARCHAR(10) NOT NULL,
    crypto_amount NUMERIC(28,8) NOT NULL,
    fiat_amount NUMERIC(28,8) NOT NULL,
    price NUMERIC(28,8) NOT NULL,
    status p2p_order_status_enum NOT NULL DEFAULT 'pending',
    payment_method TEXT,
    admin_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    disputed_at TIMESTAMPTZ
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_binary_trades_user ON binary_trades(user_id, created_at DESC);
CREATE INDEX idx_binary_trades_status_expires ON binary_trades(status, expires_at);

CREATE INDEX idx_p2p_offers_active ON p2p_offers(is_active, created_at DESC);
CREATE INDEX idx_p2p_offers_user ON p2p_offers(user_id);

CREATE INDEX idx_p2p_orders_buyer ON p2p_orders(buyer_id, status);
CREATE INDEX idx_p2p_orders_seller ON p2p_orders(seller_id, status);
CREATE INDEX idx_p2p_orders_offer ON p2p_orders(offer_id);
CREATE INDEX idx_p2p_orders_status ON p2p_orders(status, created_at DESC);
