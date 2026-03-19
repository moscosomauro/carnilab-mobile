-- CARNILAB SHOP STORAGE
-- Configuración del Bucket para imágenes de productos

-- 1. Crear Bucket 'shop' (si no existe)
insert into storage.buckets (id, name, public)
values ('shop', 'shop', true)
on conflict (id) do nothing;

-- 2. Políticas de Seguridad (RLS) para Storage

-- A. PUBLICO: Ver imágenes (Select)
create policy "Public Access Shop Images"
on storage.objects for select
using ( bucket_id = 'shop' );

-- B. VENDEDORES: Subir imágenes (Insert)
-- Solo usuarios autenticados pueden subir
create policy "Authenticated Upload Shop Images"
on storage.objects for insert
with check ( bucket_id = 'shop' and auth.role() = 'authenticated' );

-- C. VENDEDORES: Actualizar/Borrar SUS imágenes
-- Solo el dueño (que subió la imagen) puede borrarla
create policy "Owner Manage Shop Images"
on storage.objects for update
using ( bucket_id = 'shop' and auth.uid() = owner )
with check ( bucket_id = 'shop' and auth.uid() = owner );

create policy "Owner Delete Shop Images"
on storage.objects for delete
using ( bucket_id = 'shop' and auth.uid() = owner );
