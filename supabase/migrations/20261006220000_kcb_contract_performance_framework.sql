-- KCB Contract Performance Framework
-- Source contract: 30 September 2026
-- Personal ownership: all records belong to auth.uid(); no business workspace is required.

create table if not exists public.banking_performance_contracts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  contract_version text not null,
  effective_date date not null,
  title text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, contract_version),
  check (status in ('draft','active','archived'))
);

create table if not exists public.banking_contract_kpis (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.banking_performance_contracts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  code text not null,
  name text not null,
  category text not null,
  unit text not null,
  weight_percent numeric(7,3) not null,
  target_value numeric(18,4) not null,
  target_period text not null default 'monthly',
  qualification_rule text not null,
  evidence_required text not null,
  improvement_action text not null,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (contract_id, code),
  check (weight_percent >= 0 and weight_percent <= 100),
  check (target_value >= 0),
  check (target_period in ('weekly','monthly','rolling_3_month'))
);

create table if not exists public.banking_weekly_performance (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.banking_performance_contracts(id) on delete cascade,
  kpi_id uuid not null references public.banking_contract_kpis(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  actual_value numeric(18,4) not null default 0,
  qualified_value numeric(18,4) not null default 0,
  target_value numeric(18,4) not null,
  achievement_percent numeric(12,3) not null default 0,
  weighted_contribution numeric(12,3) not null default 0,
  blockers text,
  next_action text,
  manager_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (contract_id, kpi_id, week_start),
  check (actual_value >= 0),
  check (qualified_value >= 0),
  check (target_value >= 0),
  check (achievement_percent >= 0),
  check (weighted_contribution >= 0)
);

create table if not exists public.banking_performance_evidence (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.banking_performance_contracts(id) on delete cascade,
  kpi_id uuid not null references public.banking_contract_kpis(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  evidence_date date not null default current_date,
  evidence_type text not null,
  reference_text text not null,
  amount numeric(18,4),
  status text not null default 'pending',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('pending','verified','rejected')),
  check (amount is null or amount >= 0)
);

create table if not exists public.banking_improvement_plans (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.banking_performance_contracts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  status text not null default 'active',
  focus_area text not null,
  actions text not null,
  success_measure text not null,
  manager_notes text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date >= start_date),
  check (status in ('draft','active','completed','cancelled'))
);

create table if not exists public.banking_promotion_reports (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.banking_performance_contracts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  weighted_score numeric(12,3) not null default 0,
  strengths text,
  improvement_areas text,
  evidence_summary text,
  manager_summary text,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (period_end >= period_start),
  check (weighted_score >= 0),
  check (status in ('draft','submitted','reviewed'))
);

create index if not exists banking_contract_kpis_user_idx on public.banking_contract_kpis (user_id, contract_id, sort_order);
create index if not exists banking_weekly_performance_user_week_idx on public.banking_weekly_performance (user_id, week_start desc);
create index if not exists banking_performance_evidence_user_date_idx on public.banking_performance_evidence (user_id, evidence_date desc, status);
create index if not exists banking_improvement_plans_user_status_idx on public.banking_improvement_plans (user_id, status, end_date);
create index if not exists banking_promotion_reports_user_period_idx on public.banking_promotion_reports (user_id, period_end desc);

create or replace function public.banking_contract_framework_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists banking_contracts_updated_at on public.banking_performance_contracts;
create trigger banking_contracts_updated_at before update on public.banking_performance_contracts for each row execute function public.banking_contract_framework_updated_at();
drop trigger if exists banking_contract_kpis_updated_at on public.banking_contract_kpis;
create trigger banking_contract_kpis_updated_at before update on public.banking_contract_kpis for each row execute function public.banking_contract_framework_updated_at();
drop trigger if exists banking_weekly_performance_updated_at on public.banking_weekly_performance;
create trigger banking_weekly_performance_updated_at before update on public.banking_weekly_performance for each row execute function public.banking_contract_framework_updated_at();
drop trigger if exists banking_performance_evidence_updated_at on public.banking_performance_evidence;
create trigger banking_performance_evidence_updated_at before update on public.banking_performance_evidence for each row execute function public.banking_contract_framework_updated_at();
drop trigger if exists banking_improvement_plans_updated_at on public.banking_improvement_plans;
create trigger banking_improvement_plans_updated_at before update on public.banking_improvement_plans for each row execute function public.banking_contract_framework_updated_at();
drop trigger if exists banking_promotion_reports_updated_at on public.banking_promotion_reports;
create trigger banking_promotion_reports_updated_at before update on public.banking_promotion_reports for each row execute function public.banking_contract_framework_updated_at();

alter table public.banking_performance_contracts enable row level security;
alter table public.banking_contract_kpis enable row level security;
alter table public.banking_weekly_performance enable row level security;
alter table public.banking_performance_evidence enable row level security;
alter table public.banking_improvement_plans enable row level security;
alter table public.banking_promotion_reports enable row level security;

create policy "banking contracts personal access" on public.banking_performance_contracts for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "banking contract kpis personal access" on public.banking_contract_kpis for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "banking weekly performance personal access" on public.banking_weekly_performance for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "banking performance evidence personal access" on public.banking_performance_evidence for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "banking improvement plans personal access" on public.banking_improvement_plans for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "banking promotion reports personal access" on public.banking_promotion_reports for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

comment on table public.banking_performance_contracts is 'Versioned employment performance contract. Source contract version is 30 September 2026.';
comment on table public.banking_contract_kpis is 'Eight weighted contract KPI areas with qualification rules and improvement guidance.';
comment on table public.banking_weekly_performance is 'Weekly actuals and qualified values used to monitor performance before monthly review.';
comment on table public.banking_performance_evidence is 'Evidence and validation record for qualifying performance.';
comment on table public.banking_improvement_plans is 'Personal improvement plan tracker for performance gaps and promotion readiness.';
comment on table public.banking_promotion_reports is 'Promotion evidence report snapshots based on weighted performance.';
