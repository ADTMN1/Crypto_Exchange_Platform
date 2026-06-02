-- ============================================================================
-- Migration: Add OAuth Performance Indexes and Constraints
-- Purpose: Optimize OAuth provider lookups and ensure data integrity
-- ============================================================================

-- Add index for OAuth provider lookups (improves account linking performance)
CREATE INDEX IF NOT EXISTS idx_users_oauth_provider 
ON users(oauth_provider, oauth_provider_id) 
WHERE oauth_provider IS NOT NULL;

-- Add index for email lookups (already exists but ensure it's there)
CREATE INDEX IF NOT EXISTS idx_users_email_lower 
ON users(LOWER(email));

-- Add check constraint to ensure OAuth accounts have provider info
ALTER TABLE users 
ADD CONSTRAINT chk_oauth_consistency 
CHECK (
    (oauth_provider IS NULL AND oauth_provider_id IS NULL) OR
    (oauth_provider IS NOT NULL AND oauth_provider_id IS NOT NULL)
);

-- Add comment for documentation
COMMENT ON COLUMN users.oauth_provider IS 'OAuth provider name (google, github, etc.). Must be set together with oauth_provider_id.';
COMMENT ON COLUMN users.oauth_provider_id IS 'Unique identifier from OAuth provider. Must be set together with oauth_provider.';
