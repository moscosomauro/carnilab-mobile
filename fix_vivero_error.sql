-- 1. Asegurar que la columna 'plan' existe en access_keys
alter table access_keys add column if not exists plan text default 'basic';

-- 2. Borrar versiones anteriores de la función para evitar conflictos de firma
drop function if exists get_public_nursery_data(text);
drop function if exists get_public_nursery_data(json);

-- 3. Crear la función RPC corregida
create or replace function get_public_nursery_data(target_slug text)
returns json as $$
declare
  owner_record record;
  plants_list json;
begin
  -- Buscar dueño por slug
  select * into owner_record from access_keys where slug = target_slug limit 1;

  if owner_record is null then
    return json_build_object('found', false, 'error', 'Vivero no encontrado');
  end if;

  -- Obtener plantas del dueño
  select json_agg(t) into plants_list from (
    select * from plants where user_key = owner_record.key
  ) t;

  return json_build_object(
    'found', true,
    'vivero', json_build_object(
      'key', owner_record.key,
      'label', owner_record.label,
      'plan', coalesce(owner_record.plan, 'basic') -- Asegurar que nunca sea null
    ),
    'plants', coalesce(plants_list, '[]'::json)
  );
end;
$$ language plpgsql security definer;
