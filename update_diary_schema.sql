-- Add growth tracking columns to diary table
ALTER TABLE diary 
ADD COLUMN IF NOT EXISTS altura numeric,
ADD COLUMN IF NOT EXISTS hojas integer;
