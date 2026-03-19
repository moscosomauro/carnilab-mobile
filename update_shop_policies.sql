-- FIX SHOP DELETE POLICIES

-- 1. Drop ALL potentially conflicting policies
drop policy if exists "Sellers manage own products" on public.shop_products;
drop policy if exists "Sellers select own" on public.shop_products;
drop policy if exists "Sellers insert own" on public.shop_products;
drop policy if exists "Sellers update own" on public.shop_products;
drop policy if exists "Sellers delete own" on public.shop_products;

-- 2. Add 'is_featured' column (FEATURED PRODUCT SYSTEM)
alter table public.shop_products add column if not exists is_featured boolean default false;

-- 3. Create specific policies
-- SELECT: Ver propios (aunque esten inactivos)
create policy "Sellers select own" 
on public.shop_products for select 
using (owner_key = current_setting('request.headers')::json->>'x-carnilab-key' 
    or owner_key = (select key from access_keys where device_id = auth.uid() limit 1));

-- INSERT: Crear propios
create policy "Sellers insert own" 
on public.shop_products for insert 
with check (owner_key = current_setting('request.headers')::json->>'x-carnilab-key' 
    or owner_key = (select key from access_keys where device_id = auth.uid() limit 1));

-- UPDATE: Editar propios
create policy "Sellers update own" 
on public.shop_products for update 
using (owner_key = current_setting('request.headers')::json->>'x-carnilab-key' 
    or owner_key = (select key from access_keys where device_id = auth.uid() limit 1));

-- DELETE: Borrar propios (Explicit)
create policy "Sellers delete own" 
on public.shop_products for delete 
using (owner_key = current_setting('request.headers')::json->>'x-carnilab-key' 
    or owner_key = (select key from access_keys where device_id = auth.uid() limit 1));
