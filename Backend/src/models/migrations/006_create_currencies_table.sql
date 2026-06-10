-- ============================================================================
-- CRYPTO CURRENCIES TABLE
-- ============================================================================

-- Drop table if exists
DROP TABLE IF EXISTS currencies CASCADE;

-- Drop existing enum if exists
DROP TYPE IF EXISTS currency_status_enum CASCADE;

-- ============================================================================
-- CREATE ENUM TYPE
-- ============================================================================

CREATE TYPE currency_status_enum AS ENUM ('enabled', 'disabled');

-- ============================================================================
-- CURRENCIES TABLE
-- ============================================================================

CREATE TABLE currencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    symbol VARCHAR(20) NOT NULL UNIQUE,
    logo TEXT,
    status currency_status_enum NOT NULL DEFAULT 'enabled',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_currencies_symbol ON currencies(symbol);
CREATE INDEX idx_currencies_status ON currencies(status);
CREATE INDEX idx_currencies_created ON currencies(created_at DESC);

-- ============================================================================
-- INSERT DEFAULT CURRENCIES
-- ============================================================================

INSERT INTO currencies (name, symbol, logo, status) VALUES
('Bitcoin', 'BTCUSDT', 'https://cryptologos.cc/logos/bitcoin-btc-logo.png', 'enabled'),
('Ethereum', 'ETHUSDT', 'https://cryptologos.cc/logos/ethereum-eth-logo.png', 'enabled'),
('Binance Coin', 'BNBUSDT', 'https://cryptologos.cc/logos/bnb-bnb-logo.png', 'enabled'),
('Solana', 'SOLUSDT', 'https://cryptologos.cc/logos/solana-sol-logo.png', 'enabled'),
('Ripple', 'XRPUSDT', 'https://cryptologos.cc/logos/xrp-xrp-logo.png', 'enabled')
ON CONFLICT (symbol) DO NOTHING;
