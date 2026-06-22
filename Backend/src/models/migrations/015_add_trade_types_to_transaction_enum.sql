-- ==============================================================================
-- MIGRATION 015: Add TRADE_WIN and TRADE_LOSS to transaction_type_enum
-- ==============================================================================

-- Postgres doesn't allow adding enum values inside a transaction if they are used
-- So we need to use a safe approach

-- First, check if the values already exist (to avoid errors on re-run)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'TRADE_WIN' AND enumtypid = 'transaction_type_enum'::regtype) THEN
        ALTER TYPE transaction_type_enum ADD VALUE 'TRADE_WIN';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'TRADE_LOSS' AND enumtypid = 'transaction_type_enum'::regtype) THEN
        ALTER TYPE transaction_type_enum ADD VALUE 'TRADE_LOSS';
    END IF;
END $$;
