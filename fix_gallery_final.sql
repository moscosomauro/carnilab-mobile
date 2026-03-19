-- =============================================================================
-- FIX GALLERY FINAL (Asegurar acceso público y Slugs)
-- =============================================================================

-- 1. Asegurar que las PLANTAS sean públicas (Lectura)
-- Esto es indispensable para que la galería muestre algo.
DROP POLICY IF EXISTS "Public can view all plants" ON public.plants;

CREATE POLICY "Public can view all plants" ON public.plants
FOR SELECT
TO public
USING (true);

-- 2. Asegurar que todos los usuarios tengan un SLUG (Link del vivero)
-- Si un usuario antiguo no tiene slug, su galería no abre.
-- Este script genera slugs automáticos para quienes no tengan.
UPDATE public.access_keys
SET slug = lower(regexp_replace(label, '[^a-zA-Z0-9]', '-', 'g')) || '-' || substr(md5(random()::text), 1, 4)
WHERE slug IS NULL;

-- 3. Confirmar política de lectura de llaves (Por si acaso)
-- Esto permite buscar el vivero por el slug.
DROP POLICY IF EXISTS "Public can find keys by slug" ON public.access_keys;
-- (Ya debería estar cubierto por "Unified Read Access" de fix_login_final, 
-- pero si falta, esto lo arregla sin romper nada).
CREATE POLICY "Public can find keys by slug" ON public.access_keys
FOR SELECT
TO public
USING (slug IS NOT NULL);
