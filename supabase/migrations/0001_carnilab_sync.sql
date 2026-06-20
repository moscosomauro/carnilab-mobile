-- ============================================================
-- CarniLab · sync por la nube (espacio privado simple)
-- Una fila JSONB por "código de espacio". El acceso es solo por
-- dos funciones SECURITY DEFINER: hay que conocer el código para
-- leer/escribir y no se pueden listar otros espacios.
-- ============================================================

create table if not exists public.carnilab_state (
  space_id   text primary key,
  state      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- RLS prendido y SIN políticas: nadie accede a la tabla directo con la
-- anon key. Todo pasa por las funciones de abajo.
alter table public.carnilab_state enable row level security;

-- Traer el estado de un espacio (null si no existe todavía).
create or replace function public.carnilab_pull(p_space text)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select state from public.carnilab_state where space_id = p_space;
$$;

-- Guardar (upsert) el estado mergeado de un espacio.
create or replace function public.carnilab_push(p_space text, p_state jsonb)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.carnilab_state (space_id, state, updated_at)
  values (p_space, p_state, now())
  on conflict (space_id)
  do update set state = excluded.state, updated_at = now();
$$;

-- Exponer las funciones a las claves anónima y autenticada.
grant execute on function public.carnilab_pull(text) to anon, authenticated;
grant execute on function public.carnilab_push(text, jsonb) to anon, authenticated;
