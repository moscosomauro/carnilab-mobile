-- FIX BROADCAST SYSTEM FOR BACKDOOR ADMIN
-- Since the "Backdoor Admin" is not authenticated in Supabase (anon role), RLS blocks Inserts/Updates.
-- We use Security Definer functions to bypass this.

-- 1. Function to SEND broadcast
create or replace function send_broadcast(
  p_title text,
  p_message text,
  p_type text,
  p_expires_at timestamptz
)
returns uuid
language plpgsql
security definer
as $$
declare
  new_id uuid;
begin
  insert into public.system_messages (title, message, type, expires_at, active)
  values (p_title, p_message, p_type, p_expires_at, true)
  returning id into new_id;
  
  return new_id;
end;
$$;

-- 2. Function to STOP/DELETE broadcast
create or replace function stop_broadcast(p_id uuid)
returns void
language sql
security definer
as $$
  update public.system_messages
  set active = false
  where id = p_id;
$$;

-- 3. Grant execute to anon/public (since Backdoor Admin uses anon key)
grant execute on function send_broadcast to anon, authenticated, service_role;
grant execute on function stop_broadcast to anon, authenticated, service_role;
grant execute on function get_active_broadcasts to anon, authenticated, service_role;
