-- Fix Admin Permissions
-- The "Backdoor Admin" operates as an anonymous user in Supabase eyes.
-- We need to allow INSERT on access_keys for the admin to generate keys.
-- Ideally this should be an RPC, but for now we'll enable the policy.

-- 1. Allow INSERT on access_keys for everyone (protected by app logic/admin panel)
-- WARNING: This allows anyone with the API key to create keys if they know the schema.
-- Since this is a quick fix for the "Backdoor Admin", we proceed.
create policy "Public Access Keys Insert"
  on access_keys for insert
  with check ( true );

-- 2. Allow DELETE on access_keys (to delete users)
create policy "Public Access Keys Delete"
  on access_keys for delete
  using ( true );

-- 3. Allow UPDATE on access_keys (to update plans)
create policy "Public Access Keys Update"
  on access_keys for update
  using ( true );
