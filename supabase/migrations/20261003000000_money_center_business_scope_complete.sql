-- ============================================================
-- Money Center: Complete Business Scope for Expected Money
--
-- Expected money was missing the business_id and financial_scope columns
-- that all other Money Center financial entities have. This migration aligns
-- it with the established pattern used by accounts, transactions, budgets,
-- bills and debts.
--
-- Safety properties:
--   - All new columns are nullable or have safe defaults
--   - No existing data is deleted, modified, or lost
--   - Idempotent: uses IF NOT EXISTS and checks for existing data
-- ============================================================

BEGIN;

ALTER TABLE public.expected_money
  ADD COLUMN IF NOT EXISTS business_id uuid REFERENCES public.businesses(id);

ALTER TABLE public.expected_money
  ADD COLUMN IF NOT EXISTS financial_scope text NOT NULL DEFAULT 'personal';

ALTER TABLE public.expected_money
  ADD COLUMN IF NOT EXISTS business_name text;

UPDATE public.expected_money
SET
  financial_scope = CASE WHEN business_id IS NOT NULL THEN 'business' ELSE 'personal' END,
  business_name = (
    SELECT name FROM public.businesses b WHERE b.id = expected_money.business_id LIMIT 1
  )
WHERE business_id IS NOT NULL
  AND (financial_scope IS NULL OR financial_scope = 'personal');

ALTER TABLE public.expected_money
  DROP CONSTRAINT IF EXISTS expected_money_financial_scope_check;

ALTER TABLE public.expected_money
  ADD CONSTRAINT expected_money_financial_scope_check
  CHECK (financial_scope IN ('personal', 'business'));

ALTER TABLE public.expected_money
  DROP CONSTRAINT IF EXISTS expected_money_scope_requires_business_id;

ALTER TABLE public.expected_money
  ADD CONSTRAINT expected_money_scope_requires_business_id
  CHECK ((financial_scope = 'personal' AND business_id IS NULL)
         OR (financial_scope = 'business' AND business_id IS NOT NULL));

CREATE INDEX IF NOT EXISTS expected_money_business_id_idx
  ON public.expected_money(business_id)
  WHERE business_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS expected_money_scope_idx
  ON public.expected_money(user_id, financial_scope, expected_date DESC)
  WHERE deleted_at IS NULL;

COMMIT;

