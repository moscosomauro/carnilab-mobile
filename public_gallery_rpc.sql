-- Drop function if exists to allow updates
drop function if exists get_public_nursery_data;

-- Create the secure function
create or replace function get_public_nursery_data(target_slug text)
returns json
language plpgsql
security definer -- CRITICAL: This bypasses RLS policies
as $$
declare
  vivero_record record;
  plants_json json;
begin
  -- 1. Find the nursery
  select key, label into vivero_record
  from access_keys
  where slug = target_slug
  limit 1;

  if vivero_record is null then
    return json_build_object('found', false, 'error', 'Vivero no encontrado');
  end if;

  -- 2. Get the plants (Including images now, assuming RPC handles it better)
  -- We limit to 50 items for safety
  select json_agg(t) into plants_json
  from (
    select id, nombre, especie, imagen, precio_venta, en_venta, ubicacion, owner_key
    from plants
    where owner_key = vivero_record.key
    order by id desc
    limit 50
  ) t;

  return json_build_object(
    'found', true,
    'vivero', json_build_object('key', vivero_record.key, 'label', vivero_record.label),
    'plants', coalesce(plants_json, '[]'::json)
  );
end;
$$;

-- Grant execute permission to public (anon) and logged in users (authenticated)
grant execute on function get_public_nursery_data to anon, authenticated;
