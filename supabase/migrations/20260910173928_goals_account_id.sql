-- Link each savings goal to a primary Money Center account (e.g. Equity, NCBA, Family Bank, Absa).
-- Contributions can still reference any account; account_id on goals is the default "where I save for this".

ALTER TABLE public.goals
  ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS goals_account_id_idx ON public.goals (account_id)
  WHERE account_id IS NOT NULL AND deleted_at IS NULL;

COMMENT ON COLUMN public.goals.account_id IS
  'Optional primary savings account for this goal (Equity, NCBA, Absa, etc.). Shown on goal cards and used as default when adding contributions.';
