-- CORRECCIÓN FINAL: NOMBRE DE TABLA
-- La App usa 'diary', no 'cultivation_diary'.

drop function if exists get_user_stats(text);
drop function if exists get_user_stats(text, text);

create or replace function get_user_stats(p_key text, p_device_id text default null)
returns table (
  total_plants bigint,
  total_crosses bigint,
  total_diary bigint,
  total_images bigint,
  last_activity timestamptz
) 
language plpgsql
security definer
as $$
declare
  v_plants bigint;
  v_crosses bigint;
  v_diary bigint;
  v_images bigint;
  v_last_active timestamptz;
begin
  -- 1. Plantas
  select count(*) into v_plants from public.plants 
  where owner_key ilike ('%' || trim(p_key) || '%')
     or (p_device_id is not null and owner_key = p_device_id);

  -- 2. Cruzas
  select count(*) into v_crosses from public.crosses 
  where owner_key ilike ('%' || trim(p_key) || '%')
     or (p_device_id is not null and owner_key = p_device_id);

  -- 3. Bitácora (CORREGIDO: public.diary)
  select count(*) into v_diary from public.diary 
  where owner_key ilike ('%' || trim(p_key) || '%')
     or (p_device_id is not null and owner_key = p_device_id);

  -- 4. Imágenes
  select 
    (select count(*) from public.plants where (owner_key ilike ('%' || trim(p_key) || '%') or (p_device_id is not null and owner_key = p_device_id)) and imagen is not null) +
    (select count(*) from public.crosses where (owner_key ilike ('%' || trim(p_key) || '%') or (p_device_id is not null and owner_key = p_device_id)) and (madre_imagen is not null or padre_imagen is not null or hibrido_imagen is not null)) +
    (select count(*) from public.diary where (owner_key ilike ('%' || trim(p_key) || '%') or (p_device_id is not null and owner_key = p_device_id)) and imagen is not null)
  into v_images;

  -- 5. Actividad
  select max(x) into v_last_active from (
    select created_at as x from public.plants where owner_key ilike ('%' || trim(p_key) || '%') or (p_device_id is not null and owner_key = p_device_id)
    union all
    select fecha_cruza as x from public.crosses where owner_key ilike ('%' || trim(p_key) || '%') or (p_device_id is not null and owner_key = p_device_id)
    -- CORREGIDO: public.diary
    union all
    select fecha as x from public.diary where owner_key ilike ('%' || trim(p_key) || '%') or (p_device_id is not null and owner_key = p_device_id)
  ) sub;

  return query select v_plants, v_crosses, v_diary, v_images, v_last_active;
end;
$$;

grant execute on function get_user_stats to anon, authenticated, service_role;
