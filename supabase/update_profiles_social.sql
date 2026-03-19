-- Create or update profiles table to support Social Discovery
-- This table extends the default auth.users

create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  first_name text,
  last_name text,
  avatar_url text,
  slug text unique,
  
  -- Social / Discovery Fields
  country_code text, -- 2 letter ISO code (AR, MX, etc)
  city text,
  bio text,
  specialty text, -- e.g. "Nepenthes & Heliamphora"
  is_verified boolean default false,
  is_nursery_public boolean default false,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Policies
create policy "Public profiles are viewable by everyone" 
on public.profiles for select 
using (true);

create policy "Users can insert their own profile" 
on public.profiles for insert 
with check (auth.uid() = id);

create policy "Users can update their own profile" 
on public.profiles for update 
using (auth.uid() = id);

-- Function to handle handle_new_user (optional, triggers on signup)
-- For now, we assume the specific 'Inaugurar' action will populate this table.
