-- Budget scope is already persisted. Replace the legacy uniqueness key so
-- personal and business budgets can independently use the same category/month.
ALTER TABLE public.budgets
  DROP CONSTRAINT IF EXISTS budgets_user_id_category_month_key;

ALTER TABLE public.budgets
  DROP CONSTRAINT IF EXISTS budgets_scope_business_consistency;

ALTER TABLE public.budgets
  ADD CONSTRAINT budgets_scope_business_consistency CHECK (
    (financial_scope = 'personal' AND business_id IS NULL)
    OR (financial_scope = 'business' AND business_id IS NOT NULL)
  );

CREATE UNIQUE INDEX IF NOT EXISTS budgets_personal_identity_unique_idx
  ON public.budgets (user_id, category, month)
  WHERE financial_scope = 'personal';

CREATE UNIQUE INDEX IF NOT EXISTS budgets_business_identity_unique_idx
  ON public.budgets (user_id, category, month, business_id)
  WHERE financial_scope = 'business';

COMMENT ON CONSTRAINT budgets_scope_business_consistency ON public.budgets IS
  'Personal budgets have no business owner; business budgets identify exactly one business.';
