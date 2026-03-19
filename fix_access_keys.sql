-- =============================================================================
-- FIX ACCESS KEYS RLS (Login & Signup)
-- =============================================================================

-- 1. Habilitar RLS en access_keys
ALTER TABLE public.access_keys ENABLE ROW LEVEL SECURITY;

-- 2. Permitir a usuarios logueados VER su propia licencia (Para el Login)
DROP POLICY IF EXISTS "Users can view their own license" ON public.access_keys;
CREATE POLICY "Users can view their own license" ON public.access_keys
FOR SELECT
TO authenticated
USING (device_id = auth.uid());

-- 3. Permitir buscar licencias libres (Para el Registro)
-- Permite ver licencias que no tienen dueño (device_id IS NULL)
DROP POLICY IF EXISTS "Public can check unclaimed keys" ON public.access_keys;
CREATE POLICY "Public can check unclaimed keys" ON public.access_keys
FOR SELECT
TO anon, authenticated
USING (device_id IS NULL);

-- 4. Permitir vincular licencia (Para el Registro)
-- Esto es delicado. Si el registro no loguea automáticamente, se hace como anon.
-- Permitimos actualizar si la licencia no tiene dueño.
DROP POLICY IF EXISTS "Public can link license" ON public.access_keys;
CREATE POLICY "Public can link license" ON public.access_keys
FOR UPDATE
TO anon, authenticated
USING (device_id IS NULL)
WITH CHECK (device_id IS NOT NULL); 
-- El check asegura que se esté asignando un ID (aunque no podemos validar cuál es si es anon)
