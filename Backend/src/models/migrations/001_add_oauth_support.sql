-- Migration: Add OAuth Support to Users Table
-- Date: 2026-06-02
-- Description: Adds profile_picture_url, oauth_provider, and oauth_provider_id columns
--              Also makes phone_number nullable for OAuth users

-- 1. Make phone_number nullable (OAuth users might not have phone)
ALTER TABLE users 
ALTER COLUMN phone_number DROP NOT NULL;

-- 2. Add profile picture URL column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;

-- 3. Add OAuth provider column (e.g., 'google', 'github', 'facebook')
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS oauth_provider VARCHAR(20);

-- 4. Add OAuth provider ID (the ID from the OAuth provider)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS oauth_provider_id TEXT;

-- 5. Add index for OAuth lookups
CREATE INDEX IF NOT EXISTS idx_users_oauth_provider 
ON users(oauth_provider, oauth_provider_id);

-- 6. Add comment for documentation
COMMENT ON COLUMN users.profile_picture_url IS 'URL to user profile picture from OAuth or uploaded';
COMMENT ON COLUMN users.oauth_provider IS 'OAuth provider name (google, github, facebook, etc.)';
COMMENT ON COLUMN users.oauth_provider_id IS 'User ID from the OAuth provider';
