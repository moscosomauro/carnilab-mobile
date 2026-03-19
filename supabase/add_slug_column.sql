
-- Add slug column to profiles if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS slug text;

-- Make sure it's unique
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_slug_constraint') THEN 
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_slug_constraint UNIQUE (slug);
    END IF; 
END $$;

-- Also ensure other potentially missing columns from the create script are present
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS country_code text,
ADD COLUMN IF NOT EXISTS specialty text,
ADD COLUMN IF NOT EXISTS is_nursery_public boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS nursery_name text;

-- Add RLS policy for public access if not exists (simplified version)
-- (Users might have already run the previous script but it's safe to re-run policies sometimes or ignore if exists)
-- This part is just for safety, usually handled by UI logic or previous scripts.
