-- =============================================================================
-- FIX LOGIN FINAL (Consolidated Policies)
-- =============================================================================

-- 1. Limpiar políticas anteriores para evitar conflictos
DROP POLICY IF EXISTS "Users can view their own license" ON public.access_keys;
DROP POLICY IF EXISTS "Public can find keys by slug" ON public.access_keys;
DROP POLICY IF EXISTS "Public can check unclaimed keys" ON public.access_keys;
DROP POLICY IF EXISTS "Public can link license" ON public.access_keys;

-- 2. Política UNIFICADA de Lectura (SELECT)
-- Permite ver la llave si:
-- a) Eres el dueño (device_id = tu usuario)
-- b) Es una llave pública de vivero (tiene slug)
-- c) Es una llave libre (no tiene dueño)
CREATE POLICY "Unified Read Access" ON public.access_keys
FOR SELECT
TO public
USING (
  device_id = auth.uid() 
  OR 
  slug IS NOT NULL 
  OR 
  device_id IS NULL
);

-- 3. Política de Vinculación (UPDATE)
-- Solo permite vincular si la llave no tiene dueño
CREATE POLICY "Link Unclaimed License" ON public.access_keys
FOR UPDATE
TO public
USING (device_id IS NULL)
WITH CHECK (device_id = auth.uid());
