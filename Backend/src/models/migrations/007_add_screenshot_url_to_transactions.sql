-- Migration to add screenshot_url column to transactions table
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS screenshot_url TEXT;
