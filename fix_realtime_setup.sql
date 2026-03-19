-- Enable Realtime for global_settings table
-- This is required for clients to receive 'postgres_changes' events

BEGIN;

-- 1. Add table to the publication used by Supabase Realtime
-- This command instructs Postgres to send changes from this table to the Realtime API
ALTER PUBLICATION supabase_realtime ADD TABLE global_settings;

-- 2. Ensure Replica Identity is set (usually DEFAULT is fine for primary keys, but FULL is safer for complex updates)
ALTER TABLE global_settings REPLICA IDENTITY FULL;

-- 3. Verify RLS (Just in case)
-- Ensure the public policy exists (re-running this is safe-ish or we can verify manually, 
-- but explicit GRANT might be needed if public role usage is weird)
GRANT SELECT ON global_settings TO anon, authenticated;

COMMIT;
