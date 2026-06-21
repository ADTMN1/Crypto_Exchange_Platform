
-- Add usd_value column to wallets table to store permanent USD value
ALTER TABLE wallets ADD COLUMN usd_value NUMERIC(28,8) DEFAULT 0.00000000;

