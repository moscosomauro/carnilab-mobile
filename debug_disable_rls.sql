-- DEBUG: DISABLE RLS COMPLETELY
-- Use this ONLY to test if permissions are the problem.
-- If the gallery works after running this, we know the issue is RLS policies.

alter table access_keys disable row level security;
alter table plants disable row level security;

-- Also grant usage on schema just in case
grant usage on schema public to anon;
grant all on all tables in schema public to anon;
