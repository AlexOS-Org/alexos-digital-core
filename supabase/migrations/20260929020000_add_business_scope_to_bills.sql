-- AlexOS
-- Bills Business Scope
-- -------------------------------------------------------------
-- Purpose:
-- Add business-scope columns to the Bills table so Bills can belong
-- to a specific business while remaining backward-compatible with
-- existing personal Bills.
--
-- This migration follows the exact convention established by
-- `20260730190000_finance_flow_scope_and_debt_linking.sql` for the
-- other scoped financial tables (accounts, debts, transactions,
-- budgets, expected_money):
--
--   business_id     uuid REFERENCES public.businesses(id)  -- nullable
--   financial_scope text NOT NULL DEFAULT 'personal'         -- explicit scope
--   business_name  text                                       -- denormalized
--
-- Safety properties:
--   - All new columns are nullable or have a safe default, so every
--     existing Bill remains valid without modification.
--   - No data is deleted, moved, or invented.
--   - No destructive operations (no DROP COLUMN, no DROP TABLE).
--   - Idempotent: uses ADD COLUMN IF NOT EXISTS and IF NOT EXISTS guards.
-- -------------------------------------------------------------

-- -------------------------------------------------------------
-- 1. business_id: nullable FK to public.businesses
--    Null means "personal Bill" (the pre-existing default).
-- -------------------------------------------------------------
ALTER TABLE public.bills
  ADD COLUMN IF NOT EXISTS business_id uuid REFERENCES public.businesses(id);

-- -------------------------------------------------------------
-- 2. financial_scope: explicit personal/business classification.
--    Defaults to 'personal' so every existing Bill keeps its meaning.
-- -------------------------------------------------------------
ALTER TABLE public.bills
  ADD COLUMN IF NOT EXISTS financial_scope text NOT NULL DEFAULT 'personal';

-- Backfill the scope column for any rows created before this migration.
-- A Bill is a business Bill only when it already has a business_id;
-- otherwise it remains a personal Bill.
UPDATE public.bills
SET financial_scope = 'business'
WHERE business_id IS NOT NULL
  AND financial_scope IS NULL;

-- -------------------------------------------------------------
-- 3. business_name: denormalized business name for query performance,
--    matching the convention used by accounts, debts, transactions,
--    budgets and expected_money.
-- -------------------------------------------------------------
ALTER TABLE public.bills
  ADD COLUMN IF NOT EXISTS business_name text;

-- Backfill business_name from the businesses table where possible.
UPDATE public.bills b
SET business_name = bu.name
FROM public.businesses bu
WHERE b.business_id IS NOT NULL
  AND bu.id = b.business_id
  AND b.business_name IS NULL;

-- -------------------------------------------------------------
-- 4. Scope constraint, matching the CHECK used on every other
--    scoped financial table.
-- -------------------------------------------------------------
ALTER TABLE public.bills
  DROP CONSTRAINT IF EXISTS bills_financial_scope_check;

ALTER TABLE public.bills
  ADD CONSTRAINT bills_financial_scope_check
  CHECK (financial_scope IN ('personal', 'business'));

-- -------------------------------------------------------------
-- 5. Composite index for scope-scoped queries, matching the
--    `<table>_scope_idx` pattern on the other scoped tables.
-- -------------------------------------------------------------
CREATE INDEX IF NOT EXISTS bills_scope_idx
  ON public.bills(user_id, financial_scope, business_name)
  WHERE deleted_at IS NULL;

-- -------------------------------------------------------------
-- 6. Single-column index on business_id for direct business lookups,
--    matching the `<table>_business_id_idx` pattern.
-- -------------------------------------------------------------
CREATE INDEX IF NOT EXISTS bills_business_id_idx
  ON public.bills(business_id)
  WHERE business_id IS NOT NULL;

-- -------------------------------------------------------------
-- 7. RLS: the existing policy scopes by user_id only, which is
--    correct. Business isolation is enforced at the application
--    layer via business_id filtering; RLS does not need to change.
--    Re-affirm the policy so the migration is self-contained.
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "Users manage their own bills"
  ON public.bills;

CREATE POLICY "Users manage their own bills"
  ON public.bills
  FOR ALL
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bills TO authenticated;
GRANT ALL ON public.bills TO service_role;

-- -------------------------------------------------------------
-- 8. Preserve the updated_at trigger if it exists.
-- -------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_bills_updated ON public.bills;

CREATE TRIGGER trg_bills_updated
BEFORE UPDATE ON public.bills
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();