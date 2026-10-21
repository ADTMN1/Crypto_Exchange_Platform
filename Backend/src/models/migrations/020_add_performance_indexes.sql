-- Migration: 020_add_performance_indexes
-- Description: Add performance indexes for transaction and withdrawal history queries
-- Phase 1 of Database Performance Improvements

-- ============================================================================
-- INDEX 1: User Transaction History Index
-- ============================================================================
-- Purpose: Optimize user transaction history queries
-- Improves: Queries filtering by user_id with ORDER BY created_at DESC
-- Expected Benefit: 50-70% faster transaction history queries

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_user_created 
ON transactions(user_id, created_at DESC);

COMMENT ON INDEX idx_transactions_user_created IS 'Optimizes user transaction history queries with created_at ordering';

-- ============================================================================
-- INDEX 2: User Withdrawal History with Status Index
-- ============================================================================
-- Purpose: Optimize withdrawal history and admin pending withdrawal queries
-- Improves: Queries filtering by user_id and status with created_at ordering
-- Expected Benefit: 60-80% faster filtered withdrawal queries

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_withdrawals_user_status_created 
ON withdrawals(user_id, status, created_at DESC);

COMMENT ON INDEX idx_withdrawals_user_status_created IS 'Optimizes withdrawal history queries with status filtering and created_at ordering';
