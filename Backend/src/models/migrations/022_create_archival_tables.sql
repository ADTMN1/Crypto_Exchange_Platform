-- Migration: 022_create_archival_tables
-- Description: Create archival tables for audit logs and notifications
-- Phase 2 of Database Performance Improvements

-- ============================================================================
-- ARCHIVAL TABLE: audit_logs_archive
-- ============================================================================
-- Stores archived audit logs older than 12 months
-- Retention: 3 years total (12 months main + 2 years archive)

CREATE TABLE IF NOT EXISTS audit_logs_archive (
    id UUID PRIMARY KEY,
    user_id UUID,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(30) NOT NULL,
    entity_id UUID,
    ip_address INET,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL,
    archived_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index for archived audit log queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_archive_user_created 
ON audit_logs_archive(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_archive_entity 
ON audit_logs_archive(entity_type, entity_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_archive_archived 
ON audit_logs_archive(archived_at DESC);

COMMENT ON TABLE audit_logs_archive IS 'Archived audit logs older than 12 months (3 year total retention)';

-- ============================================================================
-- ARCHIVAL TABLE: notification_recipients_archive
-- ============================================================================
-- Stores archived notification recipients older than 6 months
-- Retention: 1 year total (6 months main + 6 months archive)

CREATE TABLE IF NOT EXISTS notification_recipients_archive (
    id UUID PRIMARY KEY,
    notification_id UUID,
    user_id UUID,
    is_read BOOLEAN NOT NULL,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL,
    archived_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index for archived notification queries
CREATE INDEX IF NOT EXISTS idx_notification_recipients_archive_user_created 
ON notification_recipients_archive(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notification_recipients_archive_archived 
ON notification_recipients_archive(archived_at DESC);

COMMENT ON TABLE notification_recipients_archive IS 'Archived notification recipients older than 6 months (1 year total retention)';

-- ============================================================================
-- ARCHIVAL TABLE: notifications_archive
-- ============================================================================
-- Stores archived notification content (linked to recipients_archive)
-- Retention: 1 year total (6 months main + 6 months archive)

CREATE TABLE IF NOT EXISTS notifications_archive (
    id UUID PRIMARY KEY,
    type VARCHAR(30) NOT NULL,
    title VARCHAR(100) NOT NULL,
    body TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL,
    archived_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_archive_created 
ON notifications_archive(created_at DESC);

COMMENT ON TABLE notifications_archive IS 'Archived notification content (linked to recipients_archive)';
