-- Create a table to store user push subscriptions
create table if not exists user_push_subscriptions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  subscription_json jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, subscription_json)
);

-- RLS Policies
alter table user_push_subscriptions enable row level security;

create policy "Users can insert their own subscriptions"
  on user_push_subscriptions for insert
  with check (auth.uid() = user_id);

create policy "Users can view their own subscriptions"
  on user_push_subscriptions for select
  using (auth.uid() = user_id);

create policy "Users can delete their own subscriptions"
  on user_push_subscriptions for delete
  using (auth.uid() = user_id);
