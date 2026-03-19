-- Create table for global application settings
CREATE TABLE IF NOT EXISTS global_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  updated_by TEXT -- ID of the admin who updated it
);

-- Enable RLS
ALTER TABLE global_settings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to READ settings (public themes)
CREATE POLICY "Public can read global settings" 
ON global_settings FOR SELECT 
USING (true);

-- Only Admins can UPDATE settings
-- Assuming we have an 'is_admin' check or specific user UUIDs. 
-- For now, we'll allow authenticated users to start, but ideally restrict to admin.
-- ADJUST THIS POLICY BASED ON YOUR ACTUAL ADMIN LOGIC
CREATE POLICY "Admins can update global settings" 
ON global_settings FOR UPDATE 
USING (auth.role() = 'authenticated'); -- REPLACE with actual admin check e.g. auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true)

-- Insert the default theme if it doesn't exist
INSERT INTO global_settings (key, value) 
VALUES ('theme', '"default"')
ON CONFLICT (key) DO NOTHING;
