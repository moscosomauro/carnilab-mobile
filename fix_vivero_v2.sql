-- Crear una nueva función V2 para evitar conflictos de caché o firma
create or replace function get_nursery_v2(target_slug text)
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
      'plan', coalesce(owner_record.plan, 'basic')
    ),
    'plants', coalesce(plants_list, '[]'::json)
  );
end;
$$ language plpgsql security definer;

-- Garantizar permisos de ejecución explícitos
grant execute on function get_nursery_v2(text) to anon;
grant execute on function get_nursery_v2(text) to authenticated;
grant execute on function get_nursery_v2(text) to service_role;
