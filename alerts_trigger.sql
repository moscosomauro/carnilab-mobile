-- Enable the pg_net extension if not enabled (Supabase usually has it, but good to ensure)
create extension if not exists pg_net;

-- Create a trigger function that calls the Edge Function
create or replace function public.handle_new_alert()
returns trigger
language plpgsql
security definer
as $$
declare
  -- Replace with your PROJECT REF
  project_url text := 'https://szscgmqkcwlzceyisbpi.supabase.co/functions/v1/push';
  -- Replace with your ANON KEY (o SERVICE_ROLE si prefieres, pero anon suele bastar si la function tiene seguridad)
  -- Para triggers internos es mejor usar service_role, pero aquí usaremos net.http_post
  -- Lo ideal es usar supabase_functions.http_request si existe, o net.http_post
  
  -- SIMPLIFICACIÓN: Usaremos el sistema de "Database Webhooks" nativo de Supabase desde el Dashboard si es posible.
  -- Pero como debo darte código SQL, usaremos pg_net para hacer el POST.
  
  payload jsonb;
  request_id bigint;
begin
  payload = jsonb_build_object(
    'record', row_to_json(NEW)
  );

  -- Realizar la llamada HTTP asíncrona a la Edge Function
  -- Se asume que la Edge Function valida el JWT o maneja la seguridad.
  -- Aquí enviamos un POST simple.
  
  select net.http_post(
    url := project_url,
    body := payload,
    headers := '{"Content-Type": "application/json"}'::jsonb
  ) into request_id;

  return NEW;
end;
$$;

-- Create the trigger
drop trigger if exists on_alert_created on public.alerts;

create trigger on_alert_created
  after insert on public.alerts
  for each row
  execute procedure public.handle_new_alert();
