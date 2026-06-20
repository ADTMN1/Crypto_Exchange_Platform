-- ============================================================================
-- Migration: Create Missing Support System Tables
-- Purpose: Add FAQs and blacklist tables for spam protection
-- ============================================================================

-- FAQs Table
CREATE TABLE IF NOT EXISTS faqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(50) NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Blacklist Tables for Spam Protection
CREATE TABLE IF NOT EXISTS email_blacklist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    reason TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    added_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS email_domain_blacklist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain VARCHAR(255) NOT NULL UNIQUE,
    reason TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    added_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ip_blacklist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address VARCHAR(45) NOT NULL UNIQUE,
    reason TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    added_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Spam Logs Table
CREATE TABLE IF NOT EXISTS spam_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES support_tickets(id) ON DELETE SET NULL,
    email VARCHAR(255),
    ip_address VARCHAR(45),
    spam_score INT,
    is_spam BOOLEAN,
    confidence VARCHAR(20),
    detection_reasons TEXT[],
    action_taken VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_faqs_category ON faqs(category);
CREATE INDEX IF NOT EXISTS idx_faqs_active ON faqs(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_email_blacklist_email ON email_blacklist(email);
CREATE INDEX IF NOT EXISTS idx_email_domain_blacklist_domain ON email_domain_blacklist(domain);
CREATE INDEX IF NOT EXISTS idx_ip_blacklist_ip ON ip_blacklist(ip_address);
CREATE INDEX IF NOT EXISTS idx_spam_logs_created_at ON spam_logs(created_at DESC);

-- Insert sample FAQs
INSERT INTO faqs (category, question, answer, sort_order, is_active) VALUES
('getting-started', 'How do I create an account?', 'Click the "Register" button in the top right corner, fill in your email, username, and password, then verify your email address. You can also sign up using Google OAuth for faster registration.', 1, true),
('getting-started', 'What verification is required?', 'Basic account access requires email verification. For higher withdrawal limits and full trading features, you''ll need to complete KYC (Know Your Customer) verification by uploading a government ID and proof of address.', 2, true),
('security', 'How do I enable Two-Factor Authentication (2FA)?', 'Go to Profile > Security Settings, then enable 2FA. You''ll need to scan the QR code with an authenticator app like Google Authenticator or Authy. Always save your backup codes in a secure location.', 1, true),
('security', 'What should I do if my account is compromised?', 'Immediately contact our support team via email or live chat. Change your password if you still have access, and we''ll freeze your account to prevent unauthorized transactions while we investigate.', 2, true),
('trading', 'What trading pairs are available?', 'We support major trading pairs including BTC/USDT, ETH/USDT, BNB/USDT, and many more. Visit the Markets page to see all available pairs and their current prices.', 1, true),
('trading', 'What are market and limit orders?', 'Market orders execute immediately at the current market price. Limit orders let you set a specific price at which you want to buy or sell, and will only execute when the market reaches that price.', 2, true),
('trading', 'What fees do you charge?', 'We charge a competitive 0.1% maker fee and 0.1% taker fee on all trades. Fees may vary for different trading pairs and VIP levels. Deposit fees vary by cryptocurrency, and withdrawal fees are based on network costs.', 3, true),
('wallet', 'How do I deposit cryptocurrency?', 'Go to Wallet > Deposit, select the cryptocurrency you want to deposit, and copy your unique deposit address. Send your crypto to this address from any external wallet or exchange. Wait for the required network confirmations.', 1, true),
('wallet', 'How long do deposits take?', 'Deposit times vary by cryptocurrency. Bitcoin typically requires 2-6 confirmations (20-60 minutes), while Ethereum requires 12 confirmations (3-5 minutes). Your deposit will appear in your wallet once confirmed.', 2, true),
('wallet', 'How do I withdraw funds?', 'Go to Wallet > Withdraw, select the cryptocurrency, enter the destination address and amount. Complete 2FA verification if enabled. Withdrawals are processed within 30 minutes to 24 hours depending on security checks and network conditions.', 3, true)
ON CONFLICT DO NOTHING;

-- Fix ticket_number column length
ALTER TABLE support_tickets ALTER COLUMN ticket_number TYPE VARCHAR(50);

-- Make user_id nullable for guest tickets
ALTER TABLE support_tickets ALTER COLUMN user_id DROP NOT NULL;

COMMENT ON TABLE faqs IS 'Frequently Asked Questions for self-service support';
COMMENT ON TABLE email_blacklist IS 'Blacklisted email addresses for spam prevention';
COMMENT ON TABLE email_domain_blacklist IS 'Blacklisted email domains for spam prevention';
COMMENT ON TABLE ip_blacklist IS 'Blacklisted IP addresses for spam prevention';
COMMENT ON TABLE spam_logs IS 'Spam detection logs and actions taken';
