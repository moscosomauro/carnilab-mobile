-- FIX RLS POLICIES for global_settings
-- The error "new row violates row-level security policy" occurs because 'upsert' requires INSERT permission, 
-- even if the row exists. The previous policy only allowed UPDATE.

BEGIN;

-- 1. Drop old policies to avoid conflicts
DROP POLICY IF EXISTS "Public can read global settings" ON global_settings;
DROP POLICY IF EXISTS "Admins can update global settings" ON global_settings;
DROP POLICY IF EXISTS "Admins can modify global settings" ON global_settings;

-- 2. Allow Public Read Access (Anyone can see the theme)
CREATE POLICY "Public can read global settings"
ON global_settings FOR SELECT
USING (true);

-- 3. Allow Authenticated Users to MODIFY (Insert and Update)
-- We use FOR ALL to cover Insert, Update, and Delete.
-- This is necessary for .upsert() to work correctly.
CREATE POLICY "Admins can modify global settings"
ON global_settings FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

COMMIT;
