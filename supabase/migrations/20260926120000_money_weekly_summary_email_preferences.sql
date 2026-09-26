create table if not exists public.money_weekly_summary_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enabled boolean not null default true,
  last_sent_period date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.money_weekly_summary_preferences enable row level security;

create policy "Users can read their weekly summary preference"
  on public.money_weekly_summary_preferences
  for select
  using (user_id = auth.uid());

create policy "Users can insert their weekly summary preference"
  on public.money_weekly_summary_preferences
  for insert
  with check (user_id = auth.uid());

create policy "Users can update their weekly summary preference"
  on public.money_weekly_summary_preferences
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant select, insert, update on public.money_weekly_summary_preferences to authenticated;
