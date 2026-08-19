-- PREPARATION ONLY: creates an explicit legacy-key-to-owner mapping.
-- This script does not change public.businesses or any child table.

begin;

DO $$
declare
  id_type text;
  has_user_id boolean;
begin
  if to_regclass('public.businesses') is null then
    raise exception 'BUSINESS_RECONCILIATION_ABORTED: public.businesses does not exist';
  end if;

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
    raise exception 'BUSINESS_RECONCILIATION_ABORTED: expected legacy text businesses table; found id type %, user_id column %', id_type, has_user_id;
  end if;
end $$;

create table if not exists public.business_identity_reconciliation (
  legacy_business_id text primary key,
  canonical_business_id uuid not null default gen_random_uuid() unique,
  legacy_display_name text not null,
  owner_user_id uuid references auth.users(id) on delete restrict,
  mapped_at timestamptz,
  mapped_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (legacy_business_id <> '')
);

grant all on public.business_identity_reconciliation to service_role;
revoke all on public.business_identity_reconciliation from anon, authenticated;
alter table public.business_identity_reconciliation enable row level security;

insert into public.business_identity_reconciliation (legacy_business_id, legacy_display_name)
select id, display_name
from public.businesses
on conflict (legacy_business_id) do update
set legacy_display_name = excluded.legacy_display_name;

commit;

-- STOP. Verify each owner_user_id before running activation.
