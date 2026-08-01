-- ============================================================
-- AlexOS
-- Bills Schema Reconciliation
-- ============================================================
--
-- Purpose:
-- Reconcile the live Bills table with the canonical Money Center
-- Bills contract without deleting existing columns/data.
--
-- This migration intentionally preserves the legacy:
--   - due_day
--   - next_due_date
--
-- They can be removed later after full application verification.
-- ============================================================


-- ------------------------------------------------------------
-- 1. Extend bill_frequency to the canonical values
-- ------------------------------------------------------------

ALTER TYPE public.bill_frequency
ADD VALUE IF NOT EXISTS 'one_time';


-- ------------------------------------------------------------
-- 2. Extend bill_status to the canonical values
-- ------------------------------------------------------------

ALTER TYPE public.bill_status
ADD VALUE IF NOT EXISTS 'pending';


-- ------------------------------------------------------------
-- 3. Add foreign key: bills.user_id -> auth.users.id
-- ------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'bills_user_id_fkey'
      AND conrelid = 'public.bills'::regclass
  ) THEN
    ALTER TABLE public.bills
      ADD CONSTRAINT bills_user_id_fkey
      FOREIGN KEY (user_id)
      REFERENCES auth.users(id)
      ON DELETE CASCADE;
  END IF;
END
$$;


-- ------------------------------------------------------------
-- 4. Add foreign key: bills.account_id -> accounts.id
-- ------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'bills_account_id_fkey'
      AND conrelid = 'public.bills'::regclass
  ) THEN
    ALTER TABLE public.bills
      ADD CONSTRAINT bills_account_id_fkey
      FOREIGN KEY (account_id)
      REFERENCES public.accounts(id)
      ON DELETE SET NULL;
  END IF;
END
$$;


-- ------------------------------------------------------------
-- 5. Add amount validation
-- ------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'bills_amount_nonnegative'
      AND conrelid = 'public.bills'::regclass
  ) THEN
    ALTER TABLE public.bills
      ADD CONSTRAINT bills_amount_nonnegative
      CHECK (amount >= 0);
  END IF;
END
$$;


-- ------------------------------------------------------------
-- 6. Add Bills query index
-- ------------------------------------------------------------

CREATE INDEX IF NOT EXISTS bills_user_due_idx
ON public.bills (user_id, due_date)
WHERE deleted_at IS NULL;


-- ------------------------------------------------------------
-- 7. Replace legacy RLS policy with explicit authenticated policy
-- ------------------------------------------------------------

DROP POLICY IF EXISTS "own bills"
ON public.bills;

DROP POLICY IF EXISTS "Users manage their own bills"
ON public.bills;

CREATE POLICY "Users manage their own bills"
ON public.bills
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);


-- ------------------------------------------------------------
-- 8. Ensure RLS remains enabled
-- ------------------------------------------------------------

ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;


-- ------------------------------------------------------------
-- 9. Ensure authenticated CRUD access
-- ------------------------------------------------------------

GRANT SELECT, INSERT, UPDATE, DELETE
ON public.bills
TO authenticated;


-- ------------------------------------------------------------
-- 10. Remove unnecessary anonymous CRUD privileges
-- ------------------------------------------------------------

REVOKE SELECT, INSERT, UPDATE, DELETE
ON public.bills
FROM anon;


-- ------------------------------------------------------------
-- 11. Preserve service-role access
-- ------------------------------------------------------------

GRANT ALL
ON public.bills
TO service_role;


-- ------------------------------------------------------------
-- 12. Ensure updated_at trigger exists
-- ------------------------------------------------------------

DROP TRIGGER IF EXISTS trg_bills_updated
ON public.bills;

CREATE TRIGGER trg_bills_updated
BEFORE UPDATE ON public.bills
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
