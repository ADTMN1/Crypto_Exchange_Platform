-- ============================================================================
-- SPAM PREVENTION SYSTEM - Database Migration
-- ============================================================================

-- ─── Email Blacklist Table ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS email_blacklist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    reason TEXT,
    added_by UUID REFERENCES users(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_email_blacklist_email ON email_blacklist(email) WHERE is_active = true;
CREATE INDEX idx_email_blacklist_active ON email_blacklist(is_active);

-- ─── IP Blacklist Table ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ip_blacklist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address INET NOT NULL UNIQUE,
    reason TEXT,
    added_by UUID REFERENCES users(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ip_blacklist_ip ON ip_blacklist(ip_address) WHERE is_active = true;
CREATE INDEX idx_ip_blacklist_active ON ip_blacklist(is_active);

-- ─── Email Domain Blacklist Table ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS email_domain_blacklist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain VARCHAR(255) NOT NULL UNIQUE,
    reason TEXT,
    added_by UUID REFERENCES users(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_domain_blacklist_domain ON email_domain_blacklist(domain) WHERE is_active = true;
CREATE INDEX idx_domain_blacklist_active ON email_domain_blacklist(is_active);

-- ─── Spam Log Table (for analysis and tracking) ────────────────────────────

CREATE TABLE IF NOT EXISTS spam_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES support_tickets(id) ON DELETE SET NULL,
    email VARCHAR(255),
    ip_address INET,
    spam_score INTEGER NOT NULL,
    is_spam BOOLEAN NOT NULL,
    confidence VARCHAR(20),
    detection_reasons TEXT[],
    action_taken VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_spam_logs_email ON spam_logs(email);
CREATE INDEX idx_spam_logs_ip ON spam_logs(ip_address);
CREATE INDEX idx_spam_logs_is_spam ON spam_logs(is_spam);
CREATE INDEX idx_spam_logs_created ON spam_logs(created_at DESC);

-- ─── Add spam-related fields to support_tickets table ──────────────────────

ALTER TABLE support_tickets 
ADD COLUMN IF NOT EXISTS spam_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_spam BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS spam_checked_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS ip_address INET;

CREATE INDEX idx_support_tickets_spam ON support_tickets(is_spam) WHERE is_spam = true;

-- ─── Insert common spam domains (optional - starter list) ──────────────────

INSERT INTO email_domain_blacklist (domain, reason, is_active) VALUES
('searchregister.info', 'SEO spam domain', true),
('seo-services.com', 'SEO spam domain', true),
('marketing-pro.net', 'Marketing spam domain', true),
('linkbuilding.com', 'SEO spam domain', true)
ON CONFLICT (domain) DO NOTHING;

-- ─── Comments ───────────────────────────────────────────────────────────────

COMMENT ON TABLE email_blacklist IS 'Stores blacklisted email addresses to prevent spam';
COMMENT ON TABLE ip_blacklist IS 'Stores blacklisted IP addresses to prevent spam';
COMMENT ON TABLE email_domain_blacklist IS 'Stores blacklisted email domains to prevent spam';
COMMENT ON TABLE spam_logs IS 'Logs all spam detection attempts for analysis and improvement';

-- ============================================================================
-- End of migration
-- ============================================================================
