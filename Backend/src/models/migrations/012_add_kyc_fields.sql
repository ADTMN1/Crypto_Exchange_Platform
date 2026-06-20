-- ============================================================================
-- ADD KYC FIELDS TO USER_STATUS TABLE
-- ============================================================================

-- Add KYC status enum if not exists
DROP TYPE IF EXISTS kyc_status_enum CASCADE;
CREATE TYPE kyc_status_enum AS ENUM ('unverified', 'pending', 'verified', 'rejected');

-- Add KYC columns to user_status table
ALTER TABLE user_status 
ADD COLUMN IF NOT EXISTS kyc_status kyc_status_enum NOT NULL DEFAULT 'unverified',
ADD COLUMN IF NOT EXISTS kyc_submitted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS kyc_verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS kyc_rejected_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS kyc_rejection_reason TEXT;
