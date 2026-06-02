-- Migration: Add profile_image and phone columns to users table
-- Created: 2024

-- Add profile_image column to store Cloudinary URL
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS profile_image VARCHAR(500);

-- Add phone column for user profile
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- Add updated_at timestamp
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create index on profile_image for faster queries
CREATE INDEX IF NOT EXISTS idx_users_profile_image ON users(profile_image);

COMMENT ON COLUMN users.profile_image IS 'Cloudinary URL for user profile image';
COMMENT ON COLUMN users.phone IS 'User phone number';
COMMENT ON COLUMN users.updated_at IS 'Timestamp of last profile update';
