-- Chat System Schema
-- Enables private conversations between users

-- 1. Conversations Table
create table if not exists public.conversations (
  id uuid default gen_random_uuid() primary key,
  participant_a uuid references auth.users(id) not null,
  participant_b uuid references auth.users(id) not null,
  last_message text,
  last_updated timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(participant_a, participant_b)
);

-- 2. Messages Table
create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  sender_id uuid references auth.users(id) not null,
  content text not null,
  read_status boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. RLS for Conversations
alter table public.conversations enable row level security;

create policy "Users can view their own conversations"
on public.conversations for select
using (auth.uid() = participant_a or auth.uid() = participant_b);

create policy "Users can create conversations"
on public.conversations for insert
with check (auth.uid() = participant_a or auth.uid() = participant_b);

create policy "Users can update their own conversations"
on public.conversations for update
using (auth.uid() = participant_a or auth.uid() = participant_b);

-- 4. RLS for Messages
alter table public.messages enable row level security;

create policy "Users can view messages in their conversations"
on public.messages for select
using (
  exists (
    select 1 from public.conversations
    where id = public.messages.conversation_id
    and (participant_a = auth.uid() or participant_b = auth.uid())
  )
);

create policy "Users can insert messages in their conversations"
on public.messages for insert
with check (
  auth.uid() = sender_id 
  and exists (
    select 1 from public.conversations
    where id = public.messages.conversation_id
    and (participant_a = auth.uid() or participant_b = auth.uid())
  )
);

-- 5. Realtime
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.conversations;
