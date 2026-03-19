-- Script to add hibrido_imagen column to crosses table
ALTER TABLE crosses ADD COLUMN IF NOT EXISTS hibrido_imagen TEXT;

-- Update RLS policies if necessary (usually not needed if they allow all columns for authenticated users)
-- COMMENT: Make sure you have the bucket "plant-images" ready (already exists based on previous work in the codebase).
