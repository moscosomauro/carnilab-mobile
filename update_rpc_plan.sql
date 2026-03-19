-- Redefine the RPC to include the 'plan' field in the response
create or replace function get_public_nursery_data(target_slug text)
returns json as $$
declare
  owner_record record;
  plants_list json;
begin
  -- Find owner by slug
  select * into owner_record from access_keys where slug = target_slug limit 1;

  if owner_record is null then
    return json_build_object('found', false, 'error', 'Vivero no encontrado');
  end if;

  -- Get plants
  select json_agg(t) into plants_list from (
    select * from plants where user_key = owner_record.key
  ) t;

  return json_build_object(
    'found', true,
    'vivero', json_build_object(
      'key', owner_record.key,
      'label', owner_record.label,
      'plan', owner_record.plan
    ),
    'plants', coalesce(plants_list, '[]'::json)
  );
end;
$$ language plpgsql security definer;
