-- Goal contributions remain an allocation layer, while Money Center transactions remain authoritative.
-- Existing contributions intentionally retain NULL transaction_id and surface as needs_reconciliation.

ALTER TABLE public.goal_contributions
  ADD COLUMN IF NOT EXISTS transaction_id uuid REFERENCES public.transactions(id) ON DELETE SET NULL;

ALTER TABLE public.goal_contributions
  DROP CONSTRAINT IF EXISTS goal_contributions_amount_positive;

ALTER TABLE public.goal_contributions
  ADD CONSTRAINT goal_contributions_amount_positive CHECK (amount > 0);

CREATE INDEX IF NOT EXISTS goal_contributions_transaction_idx
  ON public.goal_contributions (transaction_id)
  WHERE transaction_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS goal_contributions_transaction_unique_idx
  ON public.goal_contributions (transaction_id)
  WHERE transaction_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS goal_contribution_transaction_reference_unique_idx
  ON public.transactions (reference)
  WHERE reference IS NOT NULL AND reference LIKE 'goal-contribution:%';

COMMENT ON COLUMN public.goal_contributions.transaction_id IS
  'Optional authoritative Money Center transaction for this contribution. NULL means unlinked or needs reconciliation.';
