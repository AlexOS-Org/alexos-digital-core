-- Add business_id to DailyGear tables for business-scoped data isolation.
-- Safe to run before or after business identity reconciliation (02_activate).
-- Idempotent: no-op if the column already exists or data is already backfilled.
-- All DailyGear tables have user_id, so we can backfill business_id by joining
-- on user_id against the businesses table (identified by slug or legacy id).

do $$
declare
  has_slug boolean;
  tbl text;
  col_exists boolean;
begin
  -- Detect whether businesses table is post-reconciliation (has 'slug' column)
  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'businesses' and column_name = 'slug'
  ) into has_slug;

  -- List of DailyGear tables that need business scoping
  for tbl in values
    ('dg_products'),
    ('dg_categories'),
    ('dg_brands'),
    ('dg_suppliers'),
    ('dg_warehouses'),
    ('dg_stock_movements'),
    ('dg_customers'),
    ('dg_orders'),
    ('dg_order_items'),
    ('dg_order_expenses'),
    ('dg_order_payments'),
    ('dg_funnels'),
    ('dg_funnel_steps'),
    ('dg_storefronts'),
    ('dg_cart_sessions')
  loop
    -- Check if business_id column already exists on this table
    select exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = tbl and column_name = 'business_id'
    ) into col_exists;

    if not col_exists then
      execute format('alter table public.%I add column business_id text', tbl);
      execute format('comment on column public.%I.business_id is ''Links this record to public.businesses.id (UUID or legacy text slug)''', tbl);
    end if;

    -- Backfill existing records by joining on user_id
    if has_slug then
      -- Post-reconciliation: businesses have slug column
      execute format(
        $sql$
        update public.%I o
        set business_id = (
          select b.id from public.businesses b
          where b.slug = 'dailygear' and b.user_id = o.user_id
          limit 1
        )
        where o.business_id is null
        and o.user_id is not null
        and exists (
          select 1 from public.businesses b2
          where b2.slug = 'dailygear' and b2.user_id = o.user_id
        )
        $sql$, tbl
      );
    else
      -- Pre-reconciliation: businesses.id is a legacy text slug
      execute format(
        $sql$
        update public.%I o
        set business_id = (
          select b.id from public.businesses b
          where b.id = 'dailygear' and b.id = o.user_id::text
          limit 1
        )
        where o.business_id is null
        and o.user_id = (
          select id from public.businesses b3
          where b3.id = 'dailygear'
          limit 1
        )::text
        $sql$, tbl
      );
    end if;

    -- Index for performance
    execute format('create index if not exists idx_%I_business_id on public.%I (business_id) where business_id is not null', tbl, tbl);
  end loop;
end $$;

-- Add foreign key constraints (deferred to avoid issues with existing data).
-- These are commented because FK requires matching types; business_id is text
-- to support both pre-reconciliation (text) and post-reconciliation (uuid) states.
-- Post-reconciliation, a follow-up migration will cast business_id to uuid and add FK.
-- The application layer handles business_id lookups via the typed Business model.
