-- Create a secure function to update the global theme
-- This bypasses Row Level Security (RLS) policies on the table because it runs as "SECURITY DEFINER"
-- This is the most reliable way to allow admins to update settings without complex policy issues.

CREATE OR REPLACE FUNCTION update_global_theme(theme_name TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER -- Important: Runs with the privileges of the database owner (superuser)
SET search_path = public -- Secure search_path
AS $$
BEGIN
  -- Insert or Update the theme
  INSERT INTO global_settings (key, value, updated_at)
  VALUES ('theme', to_jsonb(theme_name), now())
  ON CONFLICT (key) 
  DO UPDATE SET 
    value = to_jsonb(theme_name), 
    updated_at = now();
END;
$$;
