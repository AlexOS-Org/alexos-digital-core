-- Add hostname column to businesses table for hostname-based business routing.
-- Safe to run before or after business identity reconciliation (02_activate).
-- Idempotent: no-op if the column already exists or data is already set.

do $$
begin
  -- Add hostname column if the post-reconciliation table is present (has 'slug' column)
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'businesses' and column_name = 'slug'
  ) then
    alter table public.businesses add column if not exists hostname text;

    update public.businesses set hostname = 'dailygear.co.ke' where slug = 'dailygear' and hostname is null;
    update public.businesses set hostname = 'novera.dailygear.co.ke' where slug = 'novera' and hostname is null;
    update public.businesses set hostname = 'cbm.dailygear.co.ke' where slug = 'carbaramotion' and hostname is null;

    create index if not exists idx_businesses_hostname on public.businesses (hostname);

    comment on column public.businesses.hostname is 'Public hostname for business-scoped routing (e.g. cbm.dailygear.co.ke)';
  end if;

  -- If only the legacy table exists (pre-reconciliation), add hostname there too.
  -- The column will be archived with the old table when reconciliation runs.
  -- After reconciliation, re-run this migration to add the column to the new table.
  if NOT exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'businesses' and column_name = 'slug'
  ) and exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'businesses' and column_name = 'display_name'
  ) then
    alter table public.businesses add column if not exists hostname text;
    update public.businesses set hostname = 'dailygear.co.ke' where id = 'dailygears' and hostname is null;
    update public.businesses set hostname = 'novera.dailygear.co.ke' where id = 'novera' and hostname is null;
    update public.businesses set hostname = 'cbm.dailygear.co.ke' where id = 'carbar_motion' and hostname is null;
  end if;
end $$;
