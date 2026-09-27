-- Cover the courier ledger foreign keys flagged by Supabase performance advisors.
-- Additive and safe: no data or financial calculations are changed.

CREATE INDEX IF NOT EXISTS dg_delivery_prepayments_account_idx
  ON public.dg_delivery_prepayments (account_id);

CREATE INDEX IF NOT EXISTS dg_delivery_prepayments_money_transaction_idx
  ON public.dg_delivery_prepayments (money_transaction_id);
