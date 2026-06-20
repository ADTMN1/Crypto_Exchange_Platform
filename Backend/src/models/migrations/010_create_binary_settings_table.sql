-- ============================================================================
-- BINARY TRADING SETTINGS TABLE
-- ============================================================================

-- Clean drop if exists
DROP TABLE IF EXISTS binary_settings CASCADE;

-- Create binary settings table
CREATE TABLE binary_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    payout_percentage NUMERIC(5,2) NOT NULL DEFAULT 80.00, -- 80% payout
    min_trade_amount NUMERIC(28,8) NOT NULL DEFAULT 1.00000000,
    max_trade_amount NUMERIC(28,8) NOT NULL DEFAULT 10000.00000000,
    allowed_expirations INT[] NOT NULL DEFAULT ARRAY[30, 60, 300, 600], -- seconds: 30s, 1m, 5m, 10m
    allowed_pairs TEXT[] NOT NULL DEFAULT ARRAY['BTC/USDT', 'ETH/USDT', 'SOL/USDT'],
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Insert default settings
INSERT INTO binary_settings (is_enabled, payout_percentage, min_trade_amount, max_trade_amount, allowed_expirations, allowed_pairs)
VALUES (TRUE, 80.00, 1.00000000, 10000.00000000, ARRAY[30, 60, 300, 600], ARRAY['BTC/USDT', 'ETH/USDT', 'SOL/USDT']);

-- Create index
CREATE INDEX idx_binary_settings_id ON binary_settings(id);
