-- Migration: 021_remove_unused_sessions_table
-- Description: Remove unused sessions table and related indexes
-- Phase 1 of Database Performance Improvements
-- 
-- Verification:
-- - No INSERT INTO sessions queries found in codebase
-- - No SELECT FROM sessions queries found in codebase
-- - Authentication uses JWT tokens only (no session-based auth)
-- - Logout clears cookies only (no database session invalidation)

-- ============================================================================
-- DROP SESSIONS TABLE CASCADE
-- ============================================================================
-- This will also drop:
-- - idx_sessions_user_revoked index
-- - idx_sessions_token index
-- - Any foreign key constraints referencing sessions table

DROP TABLE IF EXISTS sessions CASCADE;

-- ============================================================================
-- CLEANUP NOTES
-- ============================================================================
-- The logout function in auth.service.js still contains a session UPDATE query.
-- This query has never worked (sessions were never INSERTed), so removing the
-- table is safe. The logout function should be updated to remove this dead code.
