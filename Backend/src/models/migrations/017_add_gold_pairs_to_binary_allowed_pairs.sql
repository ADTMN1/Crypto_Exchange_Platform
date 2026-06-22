-- ==============================================================================
-- MIGRATION 017: Add gold pairs (XAU/USDT and XAUT/USDT) to binary allowed_pairs
-- ==============================================================================

UPDATE binary_settings
SET allowed_pairs = ARRAY['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'XAU/USDT', 'XAUT/USDT']
WHERE id IS NOT NULL;
