-- FIX AVATAR UPLOAD & ACCESS KEY PERMISSIONS

-- 1. Asegurar que RLS esta activo
ALTER TABLE public.access_keys ENABLE ROW LEVEL SECURITY;

-- 2. Permitir a los usuarios LEER su propia licencia
-- (Necesario para cargar el perfil al inicio)
DROP POLICY IF EXISTS "Users can read own license" ON public.access_keys;
CREATE POLICY "Users can read own license"
ON public.access_keys
FOR SELECT
TO authenticated
USING (device_id = auth.uid());

-- 3. Permitir a los usuarios ACTUALIZAR su propia licencia
-- (Necesario para cambiar Avatar, Nombre/Label y Slug)
DROP POLICY IF EXISTS "Users can update own license" ON public.access_keys;
CREATE POLICY "Users can update own license"
ON public.access_keys
FOR UPDATE
TO authenticated
USING (device_id = auth.uid())
WITH CHECK (device_id = auth.uid());

-- 4. Asegurar que el bucket de imagenes existe y es publico
INSERT INTO storage.buckets (id, name, public)
VALUES ('plant-images', 'plant-images', true)
ON CONFLICT (id) DO NOTHING;

-- 5. Permitir subir imagenes (Bucket Policy)
-- Permitir INSERT a usuarios autenticados
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
CREATE POLICY "Authenticated Upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'plant-images' );

-- Permitir UPDATE a dueños (para sobrescribir si fuera necesario)
DROP POLICY IF EXISTS "Owner Update" ON storage.objects;
CREATE POLICY "Owner Update"
ON storage.objects
FOR UPDATE
TO authenticated
USING ( bucket_id = 'plant-images' AND owner = auth.uid() );

-- Permitir SELECT a todos (público)
DROP POLICY IF EXISTS "Public Select" ON storage.objects;
CREATE POLICY "Public Select"
ON storage.objects
FOR SELECT
USING ( bucket_id = 'plant-images' );
