-- Business-aware budget uniqueness.
--
-- PROBLEM
--   public.budgets was created with UNIQUE(user_id, category, month)
--   (20260720172254_30405bc4-023a-4c80-9644-2cd4718f95f9.sql).
--   business_id was added later by 20260818070000_personal_business_finance_model.sql
--   but that migration did not touch the uniqueness, and no migration has since.
--
--   Money Center now writes business_id on budgets, so two different businesses
--   saving the same category + month collide on the old three-column key. The
--   upsert silently UPDATEs the other business's row, overwriting both its
--   amount and its business_id:
--
--     Business A: (user, Food, 2026-09, business_id = A, amount = 50000)
--     Business B: (user, Food, 2026-09, business_id = B, amount = 30000)
--       -> the single stored row becomes business_id = B, amount = 30000
--          and Business A's budget is destroyed with no error.
--
-- WHY NOT UNIQUE(user_id, business_id, category, month)
--   In PostgreSQL, NULLs are distinct by default in a unique index, so that
--   naive constraint would permit UNLIMITED personal budgets for the same
--   (user_id, category, month) -- the personal case would lose its uniqueness
--   entirely. NULLS NOT DISTINCT (PostgreSQL 15+) treats NULL as a normal
--   value, giving exactly one personal budget and one budget per business.
--
--   Supabase runs PostgreSQL 15+, so NULLS NOT DISTINCT is available. It is
--   also a plain-column unique constraint, which keeps ON CONFLICT usable
--   through PostgREST / supabase-js `.upsert({ onConflict })`. An expression
--   index on coalesce(business_id, ...) would NOT be usable as an upsert
--   conflict target.
--
-- SAFETY ON EXISTING DATA
--   The new key is a strict superset of the old one. The old constraint already
--   guaranteed at most one row per (user_id, category, month), so every existing
--   row trivially satisfies the new constraint. No deduplication is required and
--   no existing row is modified by this migration.
--
-- REVERSIBILITY
--   Reverting to the old key is only safe while no user has more than one
--   business budget for the same category + month; doing so would then require
--   a manual dedup. The reverse migration is:
--
--     alter table public.budgets
--       drop constraint if exists budgets_user_business_category_month_unique;
--     alter table public.budgets
--       drop constraint if exists budgets_business_scope_requires_business_id;
--     alter table public.budgets
--       add constraint budgets_user_id_category_month_key
--       unique (user_id, category, month);
--
-- -------------------------------------------------------------
-- 1. Drop the legacy three-column unique constraint.
--    Located by introspection rather than by name so the migration is robust to
--    the auto-generated name (budgets_user_id_category_month_key) and to any
--    environment where that constraint was created under a different name.
-- -------------------------------------------------------------
do $$
declare
  legacy_constraint record;
begin
  for legacy_constraint in
    select con.conname as name
    from pg_constraint con
    where con.conrelid = 'public.budgets'::regclass
      and con.contype = 'u'
      and (
        select array_agg(att.attname::text order by keys.ordinality)
        from unnest(con.conkey) with ordinality as keys(attnum, ordinality)
        join pg_attribute att
          on att.attrelid = con.conrelid
         and att.attnum = keys.attnum
      ) = array['user_id', 'category', 'month']::text[]
  loop
    execute format('alter table public.budgets drop constraint %I', legacy_constraint.name);
  end loop;
end
$$;

-- -------------------------------------------------------------
-- 2. One budget per (user, business, category, month), where a NULL
--    business_id means the single personal budget for that category/month.
--    This is the constraint `useSaveBudget` upserts against.
-- -------------------------------------------------------------
alter table public.budgets
  drop constraint if exists budgets_user_business_category_month_unique;

alter table public.budgets
  add constraint budgets_user_business_category_month_unique
  unique nulls not distinct (user_id, business_id, category, month);

-- -------------------------------------------------------------
-- 3. Guard the scope/value agreement, matching the equivalent check the
--    repository already enforces on transactions
--    (transactions_business_scope_requires_business_id,
--    20260822220000_transaction_expense_scope_and_account_guard.sql).
--
--    A budget may only claim business scope when it actually names a business.
--    This closes the same inconsistency the write paths previously allowed on
--    accounts and expected money. Existing rows keep financial_scope =
--    'personal' (the column default; no write path ever set it on budgets), so
--    this constraint is satisfied without modifying any row.
-- -------------------------------------------------------------
alter table public.budgets
  drop constraint if exists budgets_business_scope_requires_business_id;

alter table public.budgets
  add constraint budgets_business_scope_requires_business_id
  check (financial_scope <> 'business' or business_id is not null);

comment on constraint budgets_user_business_category_month_unique on public.budgets is
  'One budget per user, business (NULL = personal), category and month. NULLS NOT DISTINCT keeps the personal case unique.';
