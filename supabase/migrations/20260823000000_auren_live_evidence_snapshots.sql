-- Auren live evidence snapshots
-- Additive only. These records are advisory context and must never contribute to
-- catalogue publication, order totals, cash balances, or financial forecasts.

create table if not exists public.auren_evidence_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_id uuid references public.businesses(id) on delete set null,
  source_type text not null check (source_type in (
    'meta_ads_manager',
    'instagram_insights',
    'public_ads_library',
    'public_competitor_page'
  )),
  source_key text not null,
  source_url text,
  observed_at timestamptz not null default now(),
  window_start timestamptz,
  window_end timestamptz,
  status text not null default 'ok' check (status in ('ok', 'partial', 'unavailable')),
  confidence text not null default 'low' check (confidence in ('high', 'medium', 'low', 'insufficient')),
  summary text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists auren_evidence_snapshots_owner_observed_idx
  on public.auren_evidence_snapshots (user_id, observed_at desc);
create index if not exists auren_evidence_snapshots_source_observed_idx
  on public.auren_evidence_snapshots (source_type, source_key, observed_at desc);

create table if not exists public.auren_evidence_refresh_runs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running' check (status in ('running', 'completed', 'partial', 'failed')),
  source_status jsonb not null default '{}'::jsonb,
  rows_written integer not null default 0,
  error_message text
);

create index if not exists auren_evidence_refresh_runs_started_idx
  on public.auren_evidence_refresh_runs (started_at desc);

grant select, insert, update, delete on public.auren_evidence_snapshots to authenticated;
grant all on public.auren_evidence_snapshots to service_role;
grant select on public.auren_evidence_refresh_runs to authenticated;
grant all on public.auren_evidence_refresh_runs to service_role;

alter table public.auren_evidence_snapshots enable row level security;
alter table public.auren_evidence_refresh_runs enable row level security;

drop policy if exists "own auren evidence snapshots" on public.auren_evidence_snapshots;
create policy "own auren evidence snapshots"
  on public.auren_evidence_snapshots
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "authenticated can read auren refresh runs" on public.auren_evidence_refresh_runs;
create policy "authenticated can read auren refresh runs"
  on public.auren_evidence_refresh_runs
  for select to authenticated
  using (true);
