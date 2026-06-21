-- Migration: 013_create_withdrawals_table
-- Creates the withdrawals table for user withdrawal request management

CREATE TABLE IF NOT EXISTS withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  wallet_id UUID NOT NULL REFERENCES wallets(id),
  amount DECIMAL(18,8) NOT NULL CHECK (amount > 0),
  fee DECIMAL(18,8) DEFAULT 0,
  net_amount DECIMAL(18,8) GENERATED ALWAYS AS (amount - fee) STORED,
  currency VARCHAR(20) NOT NULL DEFAULT 'USDT',
  payment_method VARCHAR(50),
  withdrawal_address TEXT NOT NULL,
  network VARCHAR(50),
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  admin_note TEXT,
  rejection_reason TEXT,
  processed_by UUID REFERENCES users(id),
  processed_at TIMESTAMP,
  approved_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_wallet_id ON withdrawals(wallet_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_created_at ON withdrawals(created_at DESC);
