-- ============================================================================
-- Migration: Create Ticket Replies Table
-- Purpose: Support ticket conversation threads
-- ============================================================================

-- Ticket Replies Table
CREATE TABLE IF NOT EXISTS ticket_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ticket_replies_ticket_id ON ticket_replies(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_replies_created_at ON ticket_replies(created_at DESC);

COMMENT ON TABLE ticket_replies IS 'Conversation thread for support tickets';
