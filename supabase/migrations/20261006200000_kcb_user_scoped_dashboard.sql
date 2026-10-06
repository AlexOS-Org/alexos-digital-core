-- KCB activity and performance are personal records owned by the signed-in user.
-- Existing business_id values are retained for historical context, but new records
-- may be created without a workspace. Acquisition/profile/product data remains business-scoped.

-- Personal activity can exist before a workspace is created.
alter table public.banking_activity_log
  alter column business_id drop not null;
alter table public.banking_activity_log
  drop constraint if exists banking_activity_log_prospect_id_business_id_fkey;
create index if not exists banking_activity_user_date_idx
  on public.banking_activity_log (user_id, activity_date desc, created_at desc);
create index if not exists banking_activity_user_follow_up_idx
  on public.banking_activity_log (user_id, follow_up_at)
  where follow_up_at is not null and status <> 'cancelled';

create or replace function public.banking_activity_validate_prospect_owner()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.prospect_id is not null and not exists (
    select 1
    from public.banking_employee_prospects p
    where p.id = new.prospect_id and p.user_id = new.user_id
  ) then
    raise exception 'The linked prospect is not owned by this user';
  end if;
  return new;
end;
$$;

drop trigger if exists banking_activity_validate_prospect on public.banking_activity_log;
create trigger banking_activity_validate_prospect
  before insert or update on public.banking_activity_log
  for each row execute function public.banking_activity_validate_prospect_owner();

drop policy if exists "banking activity business access" on public.banking_activity_log;
create policy "banking activity personal access"
  on public.banking_activity_log for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- KPI definitions, targets, periods and snapshots are personal KCB records.
alter table public.banking_kpi_definitions alter column business_id drop not null;
alter table public.banking_kpi_targets alter column business_id drop not null;
alter table public.banking_performance_periods alter column business_id drop not null;
alter table public.banking_kpi_performance alter column business_id drop not null;

alter table public.banking_kpi_targets
  drop constraint if exists banking_kpi_targets_definition_business_fkey;
alter table public.banking_kpi_performance
  drop constraint if exists banking_kpi_performance_period_business_fkey;
alter table public.banking_kpi_performance
  drop constraint if exists banking_kpi_performance_definition_business_fkey;
alter table public.banking_kpi_performance
  drop constraint if exists banking_kpi_performance_target_business_fkey;

create unique index if not exists banking_kpi_definitions_user_code_unique_idx
  on public.banking_kpi_definitions (user_id, code);
create unique index if not exists banking_kpi_targets_user_baseline_unique_idx
  on public.banking_kpi_targets (
    user_id,
    kpi_definition_id,
    target_scope,
    coalesce(period_start, date '0001-01-01')
  );
create unique index if not exists banking_performance_periods_user_unique_idx
  on public.banking_performance_periods (user_id, period_start, target_scope);
create index if not exists banking_kpi_definitions_user_active_idx
  on public.banking_kpi_definitions (user_id, active, sort_order);
create index if not exists banking_kpi_targets_user_period_idx
  on public.banking_kpi_targets (user_id, period_start, target_scope);
create index if not exists banking_performance_periods_user_idx
  on public.banking_performance_periods (user_id, period_start desc, status);
create index if not exists banking_kpi_performance_user_period_idx
  on public.banking_kpi_performance (user_id, performance_period_id);

drop policy if exists "banking kpi definitions business access" on public.banking_kpi_definitions;
drop policy if exists "banking kpi targets business access" on public.banking_kpi_targets;
drop policy if exists "banking performance periods business access" on public.banking_performance_periods;
drop policy if exists "banking kpi performance business access" on public.banking_kpi_performance;

create policy "banking kpi definitions personal access"
  on public.banking_kpi_definitions for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "banking kpi targets personal access"
  on public.banking_kpi_targets for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "banking performance periods personal access"
  on public.banking_performance_periods for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "banking kpi performance personal access"
  on public.banking_kpi_performance for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

comment on table public.banking_activity_log is
  'Personal KCB activity log owned by auth.uid(). business_id is optional context only.';
comment on table public.banking_kpi_definitions is
  'Personal KCB KPI definitions owned by auth.uid(). business_id is optional context only.';
comment on table public.banking_performance_periods is
  'Personal KCB monthly performance periods owned by auth.uid(). business_id is optional context only.';
