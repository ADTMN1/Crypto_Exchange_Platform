-- ============================================================================
-- Migration: Create Chat Support System Tables
-- Purpose: Real-time chat support system with conversations and messages
-- ============================================================================

-- Support Conversations Table
CREATE TABLE IF NOT EXISTS support_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Support Messages Table
CREATE TABLE IF NOT EXISTS support_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES support_conversations(id) ON DELETE CASCADE,
    sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('user', 'admin')),
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_support_conversations_user_id ON support_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_support_conversations_status ON support_conversations(status);
CREATE INDEX IF NOT EXISTS idx_support_conversations_updated_at ON support_conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_messages_conversation_id ON support_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_sender_type ON support_messages(sender_type);
CREATE INDEX IF NOT EXISTS idx_support_messages_created_at ON support_messages(created_at ASC);

-- Unique constraint: One conversation per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_support_conversations_unique_user ON support_conversations(user_id);

-- Comments for documentation
COMMENT ON TABLE support_conversations IS 'Real-time support chat conversations (one per user)';
COMMENT ON TABLE support_messages IS 'Messages within support conversations';
COMMENT ON COLUMN support_conversations.status IS 'Conversation status: open or closed';
COMMENT ON COLUMN support_messages.sender_type IS 'Message sender: user or admin';
COMMENT ON COLUMN support_messages.is_read IS 'Whether the message has been read by the recipient';
