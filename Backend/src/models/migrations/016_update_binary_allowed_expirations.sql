-- ==============================================================================
-- MIGRATION 016: Update allowed expirations for binary trades
-- Add 90s, 120s, 180s durations
-- ==============================================================================

UPDATE binary_settings
SET allowed_expirations = ARRAY[30, 60, 90, 120, 180, 300]
WHERE id IS NOT NULL;
