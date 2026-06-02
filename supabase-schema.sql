-- Run this in your Supabase SQL editor after creating a project

-- Log entries table
create table if not exists log_entries (
  id uuid default gen_random_uuid() primary key,
  user_id text not null default 'default',
  category text not null,
  topic text not null,
  start_time text not null,
  end_time text not null,
  duration_minutes integer not null,
  notes text,
  date date not null,
  created_at timestamptz default now()
);

-- Weekly goals table
create table if not exists weekly_goals (
  id uuid default gen_random_uuid() primary key,
  user_id text not null default 'default',
  category text not null,
  target_minutes integer not null default 120,
  week_start date not null,
  unique(user_id, category, week_start)
);

-- Indexes for fast queries
create index if not exists log_entries_date_idx on log_entries(date desc);
create index if not exists log_entries_user_idx on log_entries(user_id);
create index if not exists log_entries_category_idx on log_entries(category);

-- Enable Row Level Security (open policy for personal use — no auth needed)
alter table log_entries enable row level security;
alter table weekly_goals enable row level security;

create policy "Allow all for personal use" on log_entries for all using (true) with check (true);
create policy "Allow all for personal use" on weekly_goals for all using (true) with check (true);
