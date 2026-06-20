-- Migration to add screenshot_url column to transactions table
ALTER TABLE transactions ADD COLUMN screenshot_url TEXT;
