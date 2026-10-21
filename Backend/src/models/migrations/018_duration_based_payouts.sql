-- ============================================================================
-- DURATION-BASED PAYOUTS MIGRATION
-- ============================================================================

-- Add new column for duration_payouts (JSONB to store payout percentages per duration)
ALTER TABLE binary_settings 
ADD COLUMN IF NOT EXISTS duration_payouts JSONB 
DEFAULT '{"30": 10.00, "60": 15.00, "300": 20.00, "600": 25.00}';

-- Add comment for clarity
COMMENT ON COLUMN binary_settings.duration_payouts IS 'JSON object mapping duration (seconds) to payout percentage (e.g., {"30": 10.00, "60": 15.00})';

-- Update the default settings to use duration_payouts while keeping payout_percentage for backward compatibility
UPDATE binary_settings 
SET duration_payouts = '{"30": 10.00, "60": 15.00, "300": 20.00, "600": 25.00}'
WHERE duration_payouts IS NULL;
