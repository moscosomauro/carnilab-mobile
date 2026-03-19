
-- Add nursery_name column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS nursery_name text;

-- Update RLS policies if necessary (existing update policy for owner should cover it)
-- BUT, let's make sure public can read it.
-- The existing policy "Public profiles are viewable by everyone" checks for is_nursery_public = true.
-- It selects * so new columns are automatically included.

-- Optional: Backfill existing nurseries with a default if needed, 
-- but for now we'll just let them be null and handle it in UI.
