-- ACTIVATION: legacy text-key businesses -> owner-scoped UUID businesses.
-- Run only after 01_prepare... and explicit owner mapping.
-- Do not run if the finance migration has already created the UUID model.

begin;

DO $$
declare
  id_type text;
  has_user_id boolean;
  unmapped_count integer;
begin
  select format_type(a.atttypid, a.atttypmod)
    into id_type
  from pg_attribute a
  where a.attrelid = 'public.businesses'::regclass
    and a.attname = 'id'
    and not a.attisdropped;

  select exists (
    select 1 from pg_attribute a
    where a.attrelid = 'public.businesses'::regclass
      and a.attname = 'user_id'
      and not a.attisdropped
  ) into has_user_id;

  if id_type <> 'text' or has_user_id then
    raise exception 'BUSINESS_RECONCILIATION_ABORTED: activation expects the legacy text businesses table';
  end if;

  select count(*) into unmapped_count
  from public.business_identity_reconciliation
  where owner_user_id is null;

  if unmapped_count > 0 then
    raise exception 'BUSINESS_RECONCILIATION_ABORTED: % owner mappings are missing', unmapped_count;
  end if;
end $$;

create table public.businesses_uuid_reconciliation (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  slug text not null,
  legacy_key text not null unique,
  business_type text,
  status text not null default 'active' check (status in ('active', 'paused', 'archived')),
  description text,
  logo_url text,
  cover_image_url text,
  currency text not null default 'KES',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  unique (user_id, slug)
);

insert into public.businesses_uuid_reconciliation (
  id, user_id, name, slug, legacy_key, currency, created_at, updated_at
)
select
  r.canonical_business_id,
  r.owner_user_id,
  r.legacy_display_name,
  r.legacy_business_id,
  r.legacy_business_id,
  'KES',
  b.created_at,
  now()
from public.business_identity_reconciliation r
join public.businesses b on b.id = r.legacy_business_id;

-- Convert Meta/media business_id values using the approved mapping.
do $$
declare
  table_name text;
  missing_count bigint;
  constraint_name text;
  child_tables constant text[] := array[
    'meta_business_connections','meta_ad_accounts','meta_pages',
    'meta_instagram_accounts','meta_pixels','meta_catalogs','meta_campaigns',
    'meta_ad_sets','meta_ads','meta_insights_daily','meta_pixel_event_daily',
    'meta_sync_runs','meta_leads','media_assets','media_collections'
  ];
begin
  foreach table_name in array child_tables loop
    if to_regclass(format('public.%s', table_name)) is null then continue; end if;
    if not exists (
      select 1 from pg_attribute
      where attrelid = format('public.%s', table_name)::regclass
        and attname = 'business_id' and not attisdropped
    ) then continue; end if;

    execute format('alter table public.%I add column business_id_uuid uuid', table_name);
    execute format(
      'update public.%I c set business_id_uuid = r.canonical_business_id from public.business_identity_reconciliation r where c.business_id = r.legacy_business_id', table_name);

    execute format(
      'select count(*) from public.%I c left join public.business_identity_reconciliation r on r.legacy_business_id = c.business_id where c.business_id is not null and r.legacy_business_id is null', table_name)
      into missing_count;
    if missing_count > 0 then
      raise exception 'BUSINESS_RECONCILIATION_ABORTED: % rows in %.business_id have no mapping', missing_count, table_name;
    end if;

    for constraint_name in
      select con.conname from pg_constraint con
      where con.conrelid = format('public.%s', table_name)::regclass
        and con.contype = 'f'
        and con.confrelid = 'public.businesses'::regclass
    loop
      execute format('alter table public.%I drop constraint %I', table_name, constraint_name);
    end loop;

    execute format('alter table public.%I drop column business_id', table_name);
    execute format('alter table public.%I rename column business_id_uuid to business_id', table_name);
  end loop;
end $$;

-- Replace the parent only after all child conversions succeeded.
alter table public.businesses rename to businesses_legacy_text_archive;
alter table public.businesses_uuid_reconciliation rename to businesses;

-- The old table may retain its legacy policy after rename. Make the archive
-- inaccessible to client roles regardless of inherited policy names.
revoke all on public.businesses_legacy_text_archive from anon, authenticated;
grant all on public.businesses_legacy_text_archive to service_role;
alter table public.businesses_legacy_text_archive enable row level security;

alter table public.businesses enable row level security;
revoke all on public.businesses from anon;
grant select, insert, update, delete on public.businesses to authenticated;
grant all on public.businesses to service_role;

create policy "businesses_owner_select" on public.businesses
for select to authenticated using ((select auth.uid()) = user_id);
create policy "businesses_owner_insert" on public.businesses
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "businesses_owner_update" on public.businesses
for update to authenticated using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy "businesses_owner_delete" on public.businesses
for delete to authenticated using ((select auth.uid()) = user_id);

-- Add parent-owner consistency to child rows that carry user_id.
do $$
declare
  table_name text;
  child_tables constant text[] := array[
    'meta_business_connections','meta_ad_accounts','meta_pages',
    'meta_instagram_accounts','meta_pixels','meta_catalogs','meta_campaigns',
    'meta_ad_sets','meta_ads','meta_insights_daily','meta_pixel_event_daily',
    'meta_leads','media_assets','media_collections'
  ];
begin
  foreach table_name in array child_tables loop
    if to_regclass(format('public.%s', table_name)) is null then continue; end if;
    if not exists (select 1 from pg_attribute where attrelid = format('public.%s', table_name)::regclass and attname = 'user_id' and not attisdropped) then continue; end if;
    execute format(
      'alter table public.%I add constraint %I foreign key (business_id, user_id) references public.businesses (id, user_id)',
      table_name, table_name || '_business_owner_fkey');
  end loop;

  if to_regclass('public.meta_sync_runs') is not null then
    alter table public.meta_sync_runs add constraint meta_sync_runs_business_id_fkey
      foreign key (business_id) references public.businesses(id);
  end if;
end $$;

revoke all on public.accounts, public.bills, public.budgets, public.debts,
  public.expected_money, public.goals, public.goal_contributions,
  public.transactions from anon;

commit;
