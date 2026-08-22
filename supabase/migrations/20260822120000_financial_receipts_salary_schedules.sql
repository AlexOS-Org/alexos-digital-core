-- DailyGear payment confirmation and AlexOS scheduled salary posting.
-- Additive and idempotent: no existing transactions are rewritten.

CREATE TABLE IF NOT EXISTS public.dg_order_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES public.dg_orders(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE RESTRICT,
  money_transaction_id uuid REFERENCES public.transactions(id) ON DELETE SET NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  transaction_id text NOT NULL,
  payment_method text NOT NULL DEFAULT 'manual_confirmation',
  paid_at timestamptz NOT NULL DEFAULT now(),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, transaction_id)
);

ALTER TABLE public.dg_order_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own dg_order_payments" ON public.dg_order_payments;
CREATE POLICY "own dg_order_payments" ON public.dg_order_payments
  FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
GRANT SELECT, INSERT, UPDATE ON public.dg_order_payments TO authenticated;
GRANT ALL ON public.dg_order_payments TO service_role;
CREATE INDEX IF NOT EXISTS dg_order_payments_order_idx ON public.dg_order_payments(order_id, paid_at DESC);
CREATE INDEX IF NOT EXISTS dg_order_payments_account_idx ON public.dg_order_payments(account_id, paid_at DESC);

CREATE TABLE IF NOT EXISTS public.money_salary_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE RESTRICT,
  name text NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  day_of_month smallint NOT NULL CHECK (day_of_month BETWEEN 1 AND 31),
  start_date date NOT NULL DEFAULT current_date,
  timezone text NOT NULL DEFAULT 'Africa/Nairobi',
  financial_scope text NOT NULL DEFAULT 'personal' CHECK (financial_scope IN ('personal', 'business')),
  business_id uuid REFERENCES public.businesses(id) ON DELETE SET NULL,
  description text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.money_salary_schedules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own money_salary_schedules" ON public.money_salary_schedules;
CREATE POLICY "own money_salary_schedules" ON public.money_salary_schedules
  FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.money_salary_schedules TO authenticated;
GRANT ALL ON public.money_salary_schedules TO service_role;
CREATE INDEX IF NOT EXISTS money_salary_schedules_due_idx
  ON public.money_salary_schedules(active, day_of_month, start_date);

CREATE TABLE IF NOT EXISTS public.money_salary_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id uuid NOT NULL REFERENCES public.money_salary_schedules(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  run_key text NOT NULL,
  run_date date NOT NULL,
  transaction_id uuid REFERENCES public.transactions(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (schedule_id, run_key)
);

ALTER TABLE public.money_salary_runs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own money_salary_runs" ON public.money_salary_runs;
CREATE POLICY "own money_salary_runs" ON public.money_salary_runs
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);
GRANT SELECT ON public.money_salary_runs TO authenticated;
GRANT ALL ON public.money_salary_runs TO service_role;

CREATE OR REPLACE FUNCTION public.dg_confirm_order_payment(
  p_order_id uuid,
  p_account_id uuid,
  p_amount numeric,
  p_transaction_id text,
  p_paid_at timestamptz DEFAULT now(),
  p_notes text DEFAULT NULL
)
RETURNS TABLE (
  payment_id uuid,
  money_transaction_id uuid,
  order_number text,
  amount_paid numeric,
  order_total numeric,
  payment_status public.dg_payment_status,
  receipt_number text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_order public.dg_orders%ROWTYPE;
  v_account public.accounts%ROWTYPE;
  v_payment public.dg_order_payments%ROWTYPE;
  v_tx public.transactions%ROWTYPE;
  v_total_paid numeric;
  v_status public.dg_payment_status;
  v_reference text;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN RAISE EXCEPTION 'Payment amount must be greater than zero'; END IF;
  IF nullif(trim(p_transaction_id), '') IS NULL THEN RAISE EXCEPTION 'Transaction ID is required'; END IF;

  SELECT * INTO v_order FROM public.dg_orders
    WHERE id = p_order_id AND user_id = v_user_id AND deleted_at IS NULL FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found'; END IF;
  SELECT * INTO v_account FROM public.accounts
    WHERE id = p_account_id AND user_id = v_user_id AND deleted_at IS NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'Receiving account not found'; END IF;

  SELECT * INTO v_payment FROM public.dg_order_payments
    WHERE user_id = v_user_id AND transaction_id = trim(p_transaction_id);
  IF FOUND THEN
    IF v_payment.order_id <> p_order_id OR v_payment.amount <> p_amount OR v_payment.account_id <> p_account_id THEN
      RAISE EXCEPTION 'Transaction ID already belongs to a different payment';
    END IF;
    SELECT t.* INTO v_tx FROM public.transactions t WHERE t.id = v_payment.money_transaction_id;
    SELECT COALESCE(sum(amount), 0) INTO v_total_paid FROM public.dg_order_payments WHERE order_id = p_order_id;
    v_status := CASE WHEN v_total_paid >= v_order.total THEN 'paid'::public.dg_payment_status ELSE 'partial'::public.dg_payment_status END;
    RETURN QUERY SELECT v_payment.id, v_payment.money_transaction_id, v_order.order_number, v_total_paid, v_order.total, v_status, 'RC-' || v_order.order_number;
    RETURN;
  END IF;

  v_reference := v_order.order_number || ':customer_receipt:' || trim(p_transaction_id);
  INSERT INTO public.transactions (
    user_id, account_id, type, amount, occurred_at, category, source,
    description, reference, status, financial_scope, business_name,
    income_type, flow_type
  ) VALUES (
    v_user_id, p_account_id, 'income', p_amount, p_paid_at, NULL, 'Customer Payment',
    'Customer receipt for ' || v_order.order_number, v_reference, 'posted',
    'business', 'DailyGear', 'sales_revenue', 'standard'
  ) RETURNING * INTO v_tx;

  INSERT INTO public.dg_order_payments (
    user_id, order_id, account_id, money_transaction_id, amount,
    transaction_id, paid_at, notes
  ) VALUES (
    v_user_id, p_order_id, p_account_id, v_tx.id, p_amount,
    trim(p_transaction_id), p_paid_at, p_notes
  ) RETURNING * INTO v_payment;

  SELECT COALESCE(sum(amount), 0) INTO v_total_paid FROM public.dg_order_payments WHERE order_id = p_order_id;
  v_status := CASE WHEN v_total_paid >= v_order.total THEN 'paid'::public.dg_payment_status ELSE 'partial'::public.dg_payment_status END;
  UPDATE public.dg_orders SET payment_status = v_status, updated_at = now() WHERE id = p_order_id;
  INSERT INTO public.dg_order_events (user_id, order_id, type, title, body)
  VALUES (v_user_id, p_order_id, 'payment', 'Payment confirmed',
    concat('KES ', to_char(p_amount, 'FM999999990.00'), ' received into ', v_account.name,
      ' · transaction ', trim(p_transaction_id)));

  RETURN QUERY SELECT v_payment.id, v_tx.id, v_order.order_number, v_total_paid, v_order.total, v_status, 'RC-' || v_order.order_number;
END;
$$;

REVOKE ALL ON FUNCTION public.dg_confirm_order_payment(uuid, uuid, numeric, text, timestamptz, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.dg_confirm_order_payment(uuid, uuid, numeric, text, timestamptz, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.money_post_due_salary_schedules(p_run_date date DEFAULT current_date)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_schedule record;
  v_run_key text;
  v_tx_id uuid;
  v_count integer := 0;
  v_last_day integer;
BEGIN
  IF current_setting('request.jwt.claim.role', true) <> 'service_role' THEN
    RAISE EXCEPTION 'Scheduled salary posting is service-role only';
  END IF;
  v_last_day := extract(day from (date_trunc('month', p_run_date) + interval '1 month - 1 day'))::integer;

  FOR v_schedule IN
    SELECT s.* FROM public.money_salary_schedules s
    WHERE s.active = true AND s.start_date <= p_run_date
      AND extract(day from p_run_date)::integer = least(s.day_of_month, v_last_day)
  LOOP
    v_run_key := to_char(p_run_date, 'YYYY-MM');
    INSERT INTO public.money_salary_runs(schedule_id, user_id, run_key, run_date)
    VALUES (v_schedule.id, v_schedule.user_id, v_run_key, p_run_date)
    ON CONFLICT (schedule_id, run_key) DO NOTHING;
    IF NOT FOUND THEN CONTINUE; END IF;

    INSERT INTO public.transactions (
      user_id, account_id, type, amount, occurred_at, source,
      description, reference, status, financial_scope, business_id,
      income_type, flow_type
    ) VALUES (
      v_schedule.user_id, v_schedule.account_id, 'income', v_schedule.amount,
      p_run_date::timestamptz, 'Salary', v_schedule.description,
      'SALARY:' || v_schedule.id || ':' || v_run_key, 'posted',
      v_schedule.financial_scope, v_schedule.business_id, 'salary', 'standard'
    ) RETURNING id INTO v_tx_id;

    UPDATE public.money_salary_runs SET transaction_id = v_tx_id WHERE schedule_id = v_schedule.id AND run_key = v_run_key;
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.money_post_due_salary_schedules(date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.money_post_due_salary_schedules(date) TO service_role;
