-- ============================================================================
-- PERMISSIONS & ADMIN MENU MANAGEMENT TABLES
-- ============================================================================

-- Clean drop existing types and tables
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS admin_menu_items CASCADE;

-- ============================================================================
-- CREATE TABLES
-- ============================================================================

-- 1. Permissions Table
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    category VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Role Permissions Junction Table
CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role_id, permission_id)
);

-- 3. Admin Menu Items Table
CREATE TABLE admin_menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label VARCHAR(100) NOT NULL,
    path VARCHAR(255) NOT NULL,
    icon VARCHAR(50),
    parent_id UUID REFERENCES admin_menu_items(id) ON DELETE CASCADE,
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    required_permission VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SEED DEFAULT DATA
-- ============================================================================

-- Seed default permissions
INSERT INTO permissions (name, code, description, category) VALUES 
('Manage Dashboard', 'dashboard:view', 'View admin dashboard', 'General'),
('Manage Users', 'users:manage', 'Manage all user accounts', 'Users'),
('Manage Trading Pairs', 'trading_pairs:manage', 'Manage spot trading pairs', 'Trading'),
('Manage Binary Options', 'binary:manage', 'Manage binary options settings and trades', 'Binary'),
('Manage Orders', 'orders:manage', 'View and manage orders', 'Orders'),
('Manage Transactions', 'transactions:manage', 'View and manage transactions', 'Transactions'),
('Manage Support Tickets', 'support:manage', 'Manage support tickets', 'Support'),
('View Audit Logs', 'audit:view', 'View system audit logs', 'Audit'),
('Manage System Settings', 'settings:manage', 'Manage system settings', 'Settings');

-- Grant all permissions to admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin';

-- Seed default admin menu items
WITH menu_items AS (
    SELECT 
        'Dashboard' AS label,
        '/admin' AS path,
        'home' AS icon,
        NULL::UUID AS parent_id,
        1 AS sort_order,
        'dashboard:view' AS required_permission
    UNION ALL
    SELECT 'Trade Management', '/admin/trade-management', 'chart-line', NULL, 2, NULL
    UNION ALL
    SELECT 'Binary Control', '/admin/trade-management/binary-control', NULL, (SELECT id FROM admin_menu_items WHERE path = '/admin/trade-management'), 1, 'binary:manage'
    UNION ALL
    SELECT 'Spot Control', '/admin/trade-management/spot-control', NULL, (SELECT id FROM admin_menu_items WHERE path = '/admin/trade-management'), 2, 'trading_pairs:manage'
    UNION ALL
    SELECT 'Manage Order', '/admin/manage-order', 'clipboard-list', NULL, 3, NULL
    UNION ALL
    SELECT 'Open Order', '/admin/manage-order/open-order', NULL, (SELECT id FROM admin_menu_items WHERE path = '/admin/manage-order'), 1, 'orders:manage'
    UNION ALL
    SELECT 'Order History', '/admin/manage-order/order-history', NULL, (SELECT id FROM admin_menu_items WHERE path = '/admin/manage-order'), 2, 'orders:manage'
    UNION ALL
    SELECT 'Trade History', '/admin/manage-order/trade-history', NULL, (SELECT id FROM admin_menu_items WHERE path = '/admin/manage-order'), 3, 'orders:manage'
    UNION ALL
    SELECT 'Manage P2P', '/admin/manage-p2p', 'handshake', NULL, 4, NULL
    UNION ALL
    SELECT 'Manage Binary', '/admin/manage-binary', 'sitemap', NULL, 5, 'binary:manage'
    UNION ALL
    SELECT 'Running Trades', '/admin/manage-binary/running-trades', NULL, (SELECT id FROM admin_menu_items WHERE path = '/admin/manage-binary'), 1, 'binary:manage'
    UNION ALL
    SELECT 'Win Trades', '/admin/manage-binary/win-trades', NULL, (SELECT id FROM admin_menu_items WHERE path = '/admin/manage-binary'), 2, 'binary:manage'
    UNION ALL
    SELECT 'Lose Trades', '/admin/manage-binary/lose-trades', NULL, (SELECT id FROM admin_menu_items WHERE path = '/admin/manage-binary'), 3, 'binary:manage'
    UNION ALL
    SELECT 'All Trades', '/admin/manage-binary/all-trades', NULL, (SELECT id FROM admin_menu_items WHERE path = '/admin/manage-binary'), 4, 'binary:manage'
    UNION ALL
    SELECT 'Manage Currency', '/admin/manage-currency', 'dollar-sign', NULL, 6, NULL
    UNION ALL
    SELECT 'Crypto Currency', '/admin/manage-currency/crypto-currency', NULL, (SELECT id FROM admin_menu_items WHERE path = '/admin/manage-currency'), 1, 'settings:manage'
    UNION ALL
    SELECT 'Fiat Currency', '/admin/manage-currency/fiat-currency', NULL, (SELECT id FROM admin_menu_items WHERE path = '/admin/manage-currency'), 2, 'settings:manage'
    UNION ALL
    SELECT 'Manage Market', '/admin/manage-market', 'chart-bar', NULL, 7, 'trading_pairs:manage'
    UNION ALL
    SELECT 'Manage Coin Pair', '/admin/manage-coin-pair', 'coins', NULL, 8, 'trading_pairs:manage'
    UNION ALL
    SELECT 'Manage Users', '/admin/users', 'users', NULL, 9, 'users:manage'
    UNION ALL
    SELECT 'Manage Referral', '/admin/manage-referral', 'user-friends', NULL, 10, 'users:manage'
    UNION ALL
    SELECT 'Deposits', '/admin/deposits', 'credit-card', NULL, 11, 'transactions:manage'
    UNION ALL
    SELECT 'Withdrawals', '/admin/withdrawals', 'money-bill-wave', NULL, 12, 'transactions:manage'
    UNION ALL
    SELECT 'Support Ticket', '/admin/support-ticket', 'ticket-alt', NULL, 13, 'support:manage'
    UNION ALL
    SELECT 'Report', '/admin/report', 'file-alt', NULL, 14, 'audit:view'
    UNION ALL
    SELECT 'Transaction History', '/admin/transaction-history', 'clipboard', NULL, 15, 'transactions:manage'
    UNION ALL
    SELECT 'Login History', '/admin/login-history', 'user', NULL, 16, 'audit:view'
    UNION ALL
    SELECT 'Audit Log', '/admin/audit', 'history', NULL, 17, 'audit:view'
    UNION ALL
    SELECT 'Notification History', '/admin/notification-history', 'bell', NULL, 18, 'settings:manage'
    UNION ALL
    SELECT 'System Setting', '/admin/system-settings', 'cog', NULL, 19, 'settings:manage'
    UNION ALL
    SELECT 'Extra', '/admin/extra', 'ellipsis-h', NULL, 20, NULL
)
INSERT INTO admin_menu_items (label, path, icon, parent_id, sort_order, required_permission)
SELECT * FROM menu_items;

-- Create indexes
CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission ON role_permissions(permission_id);
CREATE INDEX idx_admin_menu_parent ON admin_menu_items(parent_id);
CREATE INDEX idx_admin_menu_sort ON admin_menu_items(sort_order);
