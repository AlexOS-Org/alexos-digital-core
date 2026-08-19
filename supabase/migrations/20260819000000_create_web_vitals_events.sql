create table if not exists public.web_vitals_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  route text not null check (route like '/e-commerce%'),
  metric_name text not null check (metric_name in ('CLS', 'FCP', 'INP', 'LCP')),
  metric_value double precision not null check (metric_value >= 0 and metric_value <= 120000),
  metric_rating text not null check (metric_rating in ('good', 'needs-improvement', 'poor', 'unknown')),
  device_class text not null check (device_class in ('mobile', 'desktop')),
  connection_type text not null check (connection_type in ('slow-2g', '2g', '3g', '4g', '5g', 'unknown')),
  load_mode text not null check (load_mode = 'cold_or_initial'),
  release_sha text not null check (char_length(release_sha) between 1 and 128),
  created_at timestamptz not null default now()
);

create index if not exists web_vitals_events_created_at_idx
  on public.web_vitals_events (created_at desc);

create index if not exists web_vitals_events_aggregation_idx
  on public.web_vitals_events (route, metric_name, device_class, release_sha, created_at desc);

alter table public.web_vitals_events enable row level security;
alter table public.web_vitals_events force row level security;

revoke all on table public.web_vitals_events from anon, authenticated;
grant insert on table public.web_vitals_events to authenticated;
grant all on table public.web_vitals_events to service_role;

drop policy if exists web_vitals_events_insert_own on public.web_vitals_events;
create policy web_vitals_events_insert_own
  on public.web_vitals_events
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

comment on table public.web_vitals_events is
  'Privacy-minimized first-party Web Vitals events. Browser clients may insert only their own metrics; reporting uses service_role or a protected server-side aggregation job.';
