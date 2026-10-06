-- Banking Growth Phase 3: KPI & Performance Engine
-- Configurable contractual/internal KPI definitions and monthly performance snapshots.
-- No KPI defaults are seeded automatically; the application provides the approved template
-- as an explicit user action so each business can choose and adjust its configuration.

create table if not exists public.banking_kpi_definitions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete restrict,
  code text not null,
  name text not null,
  category text not null,
  unit text not null default 'count',
  weight_percent numeric(7,3) not null,
  active boolean not null default true,
  sort_order integer not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, code),
  check (weight_percent >= 0 and weight_percent <= 100)
);

create index if not exists banking_kpi_definitions_business_active_idx
  on public.banking_kpi_definitions (business_id, active, sort_order);

create table if not exists public.banking_kpi_targets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete restrict,
  kpi_definition_id uuid not null,
  target_scope text not null,
  period_start date,
  target_value numeric(18,4) not null,
  source_reference text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, kpi_definition_id, target_scope, period_start),
  check (target_scope in ('contractual','internal')),
  check (target_value >= 0),
  foreign key (kpi_definition_id)
    references public.banking_kpi_definitions(id)
    on delete cascade
);

create index if not exists banking_kpi_targets_business_period_idx
  on public.banking_kpi_targets (business_id, period_start, target_scope);

create table if not exists public.banking_performance_periods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete restrict,
  period_start date not null,
  period_end date not null,
  target_scope text not null default 'contractual',
  status text not null default 'open',
  overall_achievement_percent numeric(10,3) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, period_start, target_scope),
  check (period_end >= period_start),
  check (target_scope in ('contractual','internal')),
  check (status in ('open','submitted','approved')),
  check (overall_achievement_percent >= 0)
);

create index if not exists banking_performance_periods_business_idx
  on public.banking_performance_periods (business_id, period_start desc, status);

create table if not exists public.banking_kpi_performance (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete restrict,
  performance_period_id uuid not null,
  kpi_definition_id uuid not null,
  target_id uuid,
  target_scope text not null,
  target_value numeric(18,4) not null,
  actual_value numeric(18,4) not null default 0,
  achievement_percent numeric(12,3) not null default 0,
  weight_percent numeric(7,3) not null,
  weighted_contribution numeric(12,3) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (performance_period_id, kpi_definition_id),
  check (target_scope in ('contractual','internal')),
  check (target_value >= 0),
  check (actual_value >= 0),
  check (achievement_percent >= 0),
  check (weight_percent >= 0 and weight_percent <= 100),
  check (weighted_contribution >= 0),
  foreign key (performance_period_id)
    references public.banking_performance_periods(id)
    on delete cascade,
  foreign key (kpi_definition_id)
    references public.banking_kpi_definitions(id)
    on delete restrict,
  foreign key (target_id)
    references public.banking_kpi_targets(id)
    on delete set null
);

create index if not exists banking_kpi_performance_business_period_idx
  on public.banking_kpi_performance (business_id, performance_period_id);

-- Preserve business ownership across KPI relationships, not only row-level access.
alter table public.banking_kpi_definitions
  add constraint banking_kpi_definitions_id_business_unique unique (id, business_id);

alter table public.banking_kpi_targets
  add constraint banking_kpi_targets_definition_business_fkey
  foreign key (kpi_definition_id, business_id)
  references public.banking_kpi_definitions (id, business_id)
  on delete cascade;

alter table public.banking_kpi_targets
  add constraint banking_kpi_targets_id_business_unique unique (id, business_id);

alter table public.banking_performance_periods
  add constraint banking_performance_periods_id_business_unique unique (id, business_id);

alter table public.banking_kpi_performance
  add constraint banking_kpi_performance_period_business_fkey
  foreign key (performance_period_id, business_id)
  references public.banking_performance_periods (id, business_id)
  on delete cascade;

alter table public.banking_kpi_performance
  add constraint banking_kpi_performance_definition_business_fkey
  foreign key (kpi_definition_id, business_id)
  references public.banking_kpi_definitions (id, business_id)
  on delete restrict;

alter table public.banking_kpi_performance
  add constraint banking_kpi_performance_target_business_fkey
  foreign key (target_id, business_id)
  references public.banking_kpi_targets (id, business_id)
  on delete set null;

create unique index if not exists banking_kpi_targets_baseline_unique_idx
  on public.banking_kpi_targets (
    business_id,
    kpi_definition_id,
    target_scope,
    coalesce(period_start, date '0001-01-01')
  );


create or replace function public.banking_growth_phase3_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists banking_kpi_definitions_updated_at on public.banking_kpi_definitions;
create trigger banking_kpi_definitions_updated_at
  before update on public.banking_kpi_definitions
  for each row execute function public.banking_growth_phase3_set_updated_at();

drop trigger if exists banking_kpi_targets_updated_at on public.banking_kpi_targets;
create trigger banking_kpi_targets_updated_at
  before update on public.banking_kpi_targets
  for each row execute function public.banking_growth_phase3_set_updated_at();

drop trigger if exists banking_performance_periods_updated_at on public.banking_performance_periods;
create trigger banking_performance_periods_updated_at
  before update on public.banking_performance_periods
  for each row execute function public.banking_growth_phase3_set_updated_at();

drop trigger if exists banking_kpi_performance_updated_at on public.banking_kpi_performance;
create trigger banking_kpi_performance_updated_at
  before update on public.banking_kpi_performance
  for each row execute function public.banking_growth_phase3_set_updated_at();

alter table public.banking_kpi_definitions enable row level security;
alter table public.banking_kpi_targets enable row level security;
alter table public.banking_performance_periods enable row level security;
alter table public.banking_kpi_performance enable row level security;

create policy "banking kpi definitions business access"
on public.banking_kpi_definitions for all to authenticated
using (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.businesses b
    where b.id = business_id and b.user_id = (select auth.uid())
  )
)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.businesses b
    where b.id = business_id and b.user_id = (select auth.uid())
  )
);

create policy "banking kpi targets business access"
on public.banking_kpi_targets for all to authenticated
using (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.businesses b
    where b.id = business_id and b.user_id = (select auth.uid())
  )
)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.businesses b
    where b.id = business_id and b.user_id = (select auth.uid())
  )
);

create policy "banking performance periods business access"
on public.banking_performance_periods for all to authenticated
using (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.businesses b
    where b.id = business_id and b.user_id = (select auth.uid())
  )
)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.businesses b
    where b.id = business_id and b.user_id = (select auth.uid())
  )
);

create policy "banking kpi performance business access"
on public.banking_kpi_performance for all to authenticated
using (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.businesses b
    where b.id = business_id and b.user_id = (select auth.uid())
  )
)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.businesses b
    where b.id = business_id and b.user_id = (select auth.uid())
  )
);

comment on table public.banking_kpi_definitions is
  'Configurable Banking KPI definitions. Supports contractual and internal target profiles without embedding institution-specific commission rules.';

comment on table public.banking_kpi_targets is
  'Target values for a KPI definition. period_start is null for a reusable baseline target and a month start for a period-specific target.';

comment on table public.banking_kpi_performance is
  'Monthly KPI snapshot. Achievement is actual/target*100 and weighted contribution is achievement*weight/100. No commission formula is stored here.';
