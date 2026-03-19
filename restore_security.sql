-- RESTORE SECURITY
-- Re-enable Row Level Security on tables we disabled for debugging.

alter table access_keys enable row level security;
alter table plants enable row level security;

-- The RPC function 'get_public_nursery_data' is SECURITY DEFINER,
-- so it will continue to work perfectly even with RLS enabled.
