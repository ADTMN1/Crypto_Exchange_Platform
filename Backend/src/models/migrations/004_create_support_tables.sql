-- ============================================================================
-- Migration: Create Support System Tables
-- Purpose: Support tickets and FAQ management
-- ============================================================================

-- Create support ticket status enum
CREATE TYPE IF NOT EXISTS ticket_status_enum AS ENUM ('open', 'in_progress', 'resolved', 'closed');

-- Create support ticket category enum
CREATE TYPE IF NOT EXISTS ticket_category_enum AS ENUM (
    'general', 
    'account', 
    'trading', 
    'deposit', 
    'security', 
    'technical', 
    'kyc'
);

-- Support Tickets Table
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    category ticket_category_enum NOT NULL,
    message TEXT NOT NULL,
    status ticket_status_enum NOT NULL DEFAULT 'open',
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_category ON support_tickets(category);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_faqs_category ON faqs(category);
CREATE INDEX IF NOT EXISTS idx_faqs_active ON faqs(is_active) WHERE is_active = true;

-- Insert sample FAQs
INSERT INTO faqs (category, question, answer, sort_order, is_active) VALUES
-- Getting Started
('getting-started', 'How do I create an account?', 'Click the "Register" button in the top right corner, fill in your email, username, and password, then verify your email address. You can also sign up using Google OAuth for faster registration.', 1, true),
('getting-started', 'What verification is required?', 'Basic account access requires email verification. For higher withdrawal limits and full trading features, you''ll need to complete KYC (Know Your Customer) verification by uploading a government ID and proof of address.', 2, true),

-- Security
('security', 'How do I enable Two-Factor Authentication (2FA)?', 'Go to Profile > Security Settings, then enable 2FA. You''ll need to scan the QR code with an authenticator app like Google Authenticator or Authy. Always save your backup codes in a secure location.', 1, true),
('security', 'What should I do if my account is compromised?', 'Immediately contact our support team via email or live chat. Change your password if you still have access, and we''ll freeze your account to prevent unauthorized transactions while we investigate.', 2, true),

-- Trading
('trading', 'What trading pairs are available?', 'We support major trading pairs including BTC/USDT, ETH/USDT, BNB/USDT, and many more. Visit the Markets page to see all available pairs and their current prices.', 1, true),
('trading', 'What are market and limit orders?', 'Market orders execute immediately at the current market price. Limit orders let you set a specific price at which you want to buy or sell, and will only execute when the market reaches that price.', 2, true),
('trading', 'What fees do you charge?', 'We charge a competitive 0.1% maker fee and 0.1% taker fee on all trades. Fees may vary for different trading pairs and VIP levels. Deposit fees vary by cryptocurrency, and withdrawal fees are based on network costs.', 3, true),

-- Wallet
('wallet', 'How do I deposit cryptocurrency?', 'Go to Wallet > Deposit, select the cryptocurrency you want to deposit, and copy your unique deposit address. Send your crypto to this address from any external wallet or exchange. Wait for the required network confirmations.', 1, true),
('wallet', 'How long do deposits take?', 'Deposit times vary by cryptocurrency. Bitcoin typically requires 2-6 confirmations (20-60 minutes), while Ethereum requires 12 confirmations (3-5 minutes). Your deposit will appear in your wallet once confirmed.', 2, true),
('wallet', 'How do I withdraw funds?', 'Go to Wallet > Withdraw, select the cryptocurrency, enter the destination address and amount. Complete 2FA verification if enabled. Withdrawals are processed within 30 minutes to 24 hours depending on security checks and network conditions.', 3, true)
ON CONFLICT DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE support_tickets IS 'Customer support tickets with user inquiries and issues';
COMMENT ON TABLE faqs IS 'Frequently Asked Questions for self-service support';
COMMENT ON COLUMN support_tickets.status IS 'Current status of the ticket: open, in_progress, resolved, or closed';
COMMENT ON COLUMN support_tickets.category IS 'Type of issue: general, account, trading, deposit, security, technical, kyc';
