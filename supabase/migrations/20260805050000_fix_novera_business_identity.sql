-- Fix stale business identity: Nuvora → Novera
-- Safe to run before or after business identity reconciliation.
-- Idempotent: no-op if the rows have already been corrected.

do $$
declare
  table_name text;
begin
  -- Pre-reconciliation: legacy businesses table has (id text, display_name text)
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'businesses'
      and column_name = 'display_name'
  ) then
    -- Update child tables that reference the old business id 'nuvora'
    for table_name in
      select tablename from pg_tables
      where schemaname = 'public'
        and tablename like 'meta_%'
        and exists (
          select 1 from information_schema.columns
          where table_schema = 'public' and table_name = pg_tables.tablename
            and column_name = 'business_id'
        )
    loop
      execute format(
        'update public.%I set business_id = ''novera'' where business_id = ''nuvora''',
        table_name
      );
    end loop;

    -- Update the businesses table itself
    update public.businesses
    set id = 'novera', display_name = 'Novera'
    where id = 'nuvora' and display_name = 'Nuvora';
  end if;

  -- Post-reconciliation: new businesses table has (id uuid, name text, slug text, user_id uuid)
  -- The slug was derived from the legacy id 'nuvora'.
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'businesses'
      and column_name = 'slug'
  ) then
    update public.businesses
    set slug = 'novera', name = 'Novera'
    where slug = 'nuvora' and name = 'Nuvora';
  end if;
end $$;
