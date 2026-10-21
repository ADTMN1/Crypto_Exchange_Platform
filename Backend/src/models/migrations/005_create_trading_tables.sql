-- Migration: Create trading-related tables (PostgreSQL)
-- Description: User favorites, trading preferences, price alerts, session
--              analytics, market data cache, and watchlists.
-- Note: converted from the original MySQL-flavoured definition.

-- User favorite trading symbols
CREATE TABLE IF NOT EXISTS user_favorite_symbols (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_symbol UNIQUE (user_id, symbol)
);

CREATE INDEX IF NOT EXISTS idx_user_favorite_symbols_user_id ON user_favorite_symbols(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorite_symbols_symbol ON user_favorite_symbols(symbol);

-- User trading preferences and settings
CREATE TABLE IF NOT EXISTS user_trading_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    default_order_type VARCHAR(10) NOT NULL DEFAULT 'limit'
        CHECK (default_order_type IN ('market', 'limit', 'stop')),
    default_chart_interval VARCHAR(10) NOT NULL DEFAULT '1m',
    show_indicators JSONB,
    chart_theme VARCHAR(10) NOT NULL DEFAULT 'dark'
        CHECK (chart_theme IN ('dark', 'light')),
    sound_alerts BOOLEAN NOT NULL DEFAULT TRUE,
    email_alerts BOOLEAN NOT NULL DEFAULT FALSE,
    push_alerts BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_trading_preferences_user_id ON user_trading_preferences(user_id);

-- Price alerts
CREATE TABLE IF NOT EXISTS price_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL,
    target_price NUMERIC(20,8) NOT NULL,
    alert_type VARCHAR(10) NOT NULL CHECK (alert_type IN ('above', 'below')),
    message TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    triggered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_price_alerts_user_symbol ON price_alerts(user_id, symbol);
CREATE INDEX IF NOT EXISTS idx_price_alerts_active ON price_alerts(is_active, symbol);
CREATE INDEX IF NOT EXISTS idx_price_alerts_triggered ON price_alerts(triggered_at);

-- Trading sessions (analytics / session management)
CREATE TABLE IF NOT EXISTS trading_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    symbols_viewed JSONB,
    started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMPTZ,
    last_activity TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_trading_sessions_user_id ON trading_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_trading_sessions_token ON trading_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_trading_sessions_last_activity ON trading_sessions(last_activity);

-- Market data cache (for frequently accessed data)
CREATE TABLE IF NOT EXISTS market_data_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol VARCHAR(20) NOT NULL,
    data_type VARCHAR(10) NOT NULL
        CHECK (data_type IN ('ticker', 'kline', 'orderbook', 'trades')),
    interval_type VARCHAR(10),
    data JSONB NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_cache_key UNIQUE (symbol, data_type, interval_type)
);

CREATE INDEX IF NOT EXISTS idx_market_data_cache_symbol ON market_data_cache(symbol);
CREATE INDEX IF NOT EXISTS idx_market_data_cache_expires ON market_data_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_market_data_cache_data_type ON market_data_cache(data_type);

-- User watchlists (custom lists of symbols)
CREATE TABLE IF NOT EXISTS user_watchlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_list_name UNIQUE (user_id, name)
);

CREATE INDEX IF NOT EXISTS idx_user_watchlists_user_id ON user_watchlists(user_id);

-- Watchlist items
CREATE TABLE IF NOT EXISTS user_watchlist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    watchlist_id UUID NOT NULL REFERENCES user_watchlists(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_watchlist_symbol UNIQUE (watchlist_id, symbol)
);

CREATE INDEX IF NOT EXISTS idx_user_watchlist_items_watchlist_id ON user_watchlist_items(watchlist_id);
CREATE INDEX IF NOT EXISTS idx_user_watchlist_items_symbol ON user_watchlist_items(symbol);
CREATE INDEX IF NOT EXISTS idx_user_watchlist_items_sort_order ON user_watchlist_items(sort_order);
