-- ============================================================================
-- Migration: Update Support Tickets Table
-- Purpose: Add missing columns for ticket management
-- ============================================================================

-- Add ticket_number column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'support_tickets' 
                   AND column_name = 'ticket_number') THEN
        ALTER TABLE support_tickets ADD COLUMN ticket_number VARCHAR(20) UNIQUE;
        
        -- Generate ticket numbers for existing records
        UPDATE support_tickets 
        SET ticket_number = 'TK-' || EXTRACT(EPOCH FROM created_at)::BIGINT || '-' || (1000 + (random() * 9000)::INT)
        WHERE ticket_number IS NULL;
        
        -- Make it NOT NULL after populating
        ALTER TABLE support_tickets ALTER COLUMN ticket_number SET NOT NULL;
    END IF;
END $$;

-- Add description column if it doesn't exist (rename message to description)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'support_tickets' 
               AND column_name = 'message') 
    AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'support_tickets' 
                    AND column_name = 'description') THEN
        ALTER TABLE support_tickets RENAME COLUMN message TO description;
    END IF;
    
    -- If neither exists, create description
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'support_tickets' 
                   AND column_name = 'description') THEN
        ALTER TABLE support_tickets ADD COLUMN description TEXT;
    END IF;
END $$;

-- Add priority column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'support_tickets' 
                   AND column_name = 'priority') THEN
        ALTER TABLE support_tickets ADD COLUMN priority ticket_priority_enum NOT NULL DEFAULT 'medium';
    END IF;
END $$;

-- Add last_reply_at column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'support_tickets' 
                   AND column_name = 'last_reply_at') THEN
        ALTER TABLE support_tickets ADD COLUMN last_reply_at TIMESTAMPTZ;
    END IF;
END $$;

-- Add last_reply_by column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'support_tickets' 
                   AND column_name = 'last_reply_by') THEN
        ALTER TABLE support_tickets ADD COLUMN last_reply_by UUID REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add closed_at column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'support_tickets' 
                   AND column_name = 'closed_at') THEN
        ALTER TABLE support_tickets ADD COLUMN closed_at TIMESTAMPTZ;
    END IF;
END $$;

-- Remove category and name/email columns if they exist (moved to separate user context)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'support_tickets' 
               AND column_name = 'category') THEN
        ALTER TABLE support_tickets DROP COLUMN category;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'support_tickets' 
               AND column_name = 'name') THEN
        ALTER TABLE support_tickets DROP COLUMN name;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'support_tickets' 
               AND column_name = 'email') THEN
        ALTER TABLE support_tickets DROP COLUMN email;
    END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_support_tickets_ticket_number ON support_tickets(ticket_number);
CREATE INDEX IF NOT EXISTS idx_support_tickets_last_reply_at ON support_tickets(last_reply_at DESC);

COMMENT ON COLUMN support_tickets.ticket_number IS 'Unique ticket identifier for user reference';
COMMENT ON COLUMN support_tickets.priority IS 'Ticket priority: low, medium, high, urgent';
COMMENT ON COLUMN support_tickets.last_reply_at IS 'Timestamp of the last reply to this ticket';
COMMENT ON COLUMN support_tickets.last_reply_by IS 'User ID of who sent the last reply';

