-- Finance flow v1: distinguish personal vs business money and model loan receipts
-- separately from operating income.

ALTER TABLE public.accounts
  ADD COLUMN IF NOT EXISTS financial_scope text NOT NULL DEFAULT 'personal',
  ADD COLUMN IF NOT EXISTS business_name text;

ALTER TABLE public.accounts
  DROP CONSTRAINT IF EXISTS accounts_financial_scope_check;
ALTER TABLE public.accounts
  ADD CONSTRAINT accounts_financial_scope_check
  CHECK (financial_scope IN ('personal', 'business'));

ALTER TABLE public.debts
  ADD COLUMN IF NOT EXISTS financial_scope text NOT NULL DEFAULT 'personal',
  ADD COLUMN IF NOT EXISTS business_name text,
  ADD COLUMN IF NOT EXISTS disbursement_account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS interest_paid numeric NOT NULL DEFAULT 0;

ALTER TABLE public.debts
  DROP CONSTRAINT IF EXISTS debts_financial_scope_check;
ALTER TABLE public.debts
  ADD CONSTRAINT debts_financial_scope_check
  CHECK (financial_scope IN ('personal', 'business'));

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS financial_scope text NOT NULL DEFAULT 'personal',
  ADD COLUMN IF NOT EXISTS business_name text,
  ADD COLUMN IF NOT EXISTS debt_id uuid REFERENCES public.debts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS flow_type text NOT NULL DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS principal_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS interest_amount numeric NOT NULL DEFAULT 0;

ALTER TABLE public.transactions
  DROP CONSTRAINT IF EXISTS transactions_financial_scope_check;
ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_financial_scope_check
  CHECK (financial_scope IN ('personal', 'business'));

ALTER TABLE public.transactions
  DROP CONSTRAINT IF EXISTS transactions_flow_type_check;
ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_flow_type_check
  CHECK (flow_type IN ('standard', 'loan_received', 'debt_payment', 'debt_interest'));

ALTER TABLE public.transactions
  DROP CONSTRAINT IF EXISTS transactions_debt_components_check;
ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_debt_components_check
  CHECK (
    principal_amount >= 0
    AND interest_amount >= 0
    AND principal_amount + interest_amount <= amount
  );

ALTER TABLE public.budgets
  ADD COLUMN IF NOT EXISTS financial_scope text NOT NULL DEFAULT 'personal',
  ADD COLUMN IF NOT EXISTS business_name text;

ALTER TABLE public.budgets
  DROP CONSTRAINT IF EXISTS budgets_financial_scope_check;
ALTER TABLE public.budgets
  ADD CONSTRAINT budgets_financial_scope_check
  CHECK (financial_scope IN ('personal', 'business'));

ALTER TABLE public.expected_money
  ADD COLUMN IF NOT EXISTS financial_scope text NOT NULL DEFAULT 'personal',
  ADD COLUMN IF NOT EXISTS business_name text;

ALTER TABLE public.expected_money
  DROP CONSTRAINT IF EXISTS expected_money_financial_scope_check;
ALTER TABLE public.expected_money
  ADD CONSTRAINT expected_money_financial_scope_check
  CHECK (financial_scope IN ('personal', 'business'));

CREATE INDEX IF NOT EXISTS accounts_scope_idx
  ON public.accounts(user_id, financial_scope, business_name)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS debts_scope_idx
  ON public.debts(user_id, financial_scope, business_name)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS transactions_scope_idx
  ON public.transactions(user_id, financial_scope, business_name, occurred_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS transactions_debt_idx
  ON public.transactions(debt_id)
  WHERE deleted_at IS NULL;

-- Rebuild balances so loan receipts increase cash without being classified as income,
-- while principal/interest debt payments reduce cash without treating principal as an expense.
CREATE OR REPLACE VIEW public.account_balances
WITH (security_invoker = true)
AS
SELECT
  a.id AS account_id,
  a.user_id,
  a.opening_balance
    + COALESCE(SUM(CASE
        WHEN t.type = 'income' THEN t.amount
        WHEN t.type = 'expense' THEN -t.amount
        WHEN t.type = 'transfer' AND t.account_id = a.id THEN -t.amount
        WHEN t.type = 'transfer' AND t.transfer_account_id = a.id THEN t.amount
        WHEN t.type = 'adjustment' AND t.flow_type = 'loan_received' THEN t.amount
        WHEN t.type = 'adjustment' AND t.flow_type IN ('debt_payment', 'debt_interest') THEN -t.amount
        WHEN t.type = 'adjustment' AND t.flow_type = 'standard' AND t.account_id = a.id THEN t.amount
        ELSE 0 END), 0) AS balance,
  COALESCE(SUM(CASE
      WHEN t.type = 'income' AND t.account_id = a.id THEN t.amount
      WHEN t.type = 'transfer' AND t.transfer_account_id = a.id THEN t.amount
      WHEN t.type = 'adjustment' AND t.flow_type = 'loan_received' AND t.account_id = a.id THEN t.amount
      ELSE 0 END), 0) AS money_in,
  COALESCE(SUM(CASE
      WHEN t.type = 'expense' AND t.account_id = a.id THEN t.amount
      WHEN t.type = 'transfer' AND t.account_id = a.id THEN t.amount
      WHEN t.type = 'adjustment' AND t.flow_type IN ('debt_payment', 'debt_interest') AND t.account_id = a.id THEN t.amount
      WHEN t.type = 'adjustment' AND t.flow_type = 'standard' AND t.account_id = a.id AND t.amount > 0 THEN 0
      ELSE 0 END), 0) AS money_out
FROM public.accounts a
LEFT JOIN public.transactions t
  ON t.user_id = a.user_id
 AND t.deleted_at IS NULL
 AND t.status = 'posted'
 AND (t.account_id = a.id OR t.transfer_account_id = a.id)
WHERE a.deleted_at IS NULL
GROUP BY a.id;

GRANT SELECT ON public.account_balances TO authenticated;

COMMENT ON COLUMN public.accounts.financial_scope IS 'personal or business ownership of this cash account';
COMMENT ON COLUMN public.debts.financial_scope IS 'personal or business responsibility for this debt';
COMMENT ON COLUMN public.transactions.flow_type IS 'standard, loan_received, debt_payment, or debt_interest';
COMMENT ON COLUMN public.transactions.principal_amount IS 'Principal portion of a debt payment; not an operating expense';
COMMENT ON COLUMN public.transactions.interest_amount IS 'Interest portion of a debt payment; treated as an expense';
