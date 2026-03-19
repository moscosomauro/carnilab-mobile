-- ADD MISSING COLUMN FOR AVATAR
-- La columna 'avatar_url' falta en la tabla 'access_keys'.
-- Este script la agrega.

ALTER TABLE public.access_keys
ADD COLUMN IF NOT EXISTS avatar_url text;

-- Aseguramos que los permisos de lectura/escritura incluyan esta columna
-- (Esto generalmente es automático en Postgres, pero refresca el caché de esquema de Supabase)
notify pgrst, 'reload schema';
