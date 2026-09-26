-- Courier / Speedaf prepayment ledger and SECURITY DEFINER hardening.
-- Additive, idempotent, and separate from product/tithe calculations.

ALTER TABLE public.dg_orders
  ADD COLUMN IF NOT EXISTS delivery_payment_status text NOT NULL DEFAULT 'cod',
  ADD COLUMN IF NOT EXISTS delivery_prepayment_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS delivery_amount_due numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS delivery_provider text;

ALTER TABLE public.dg_orders
  DROP CONSTRAINT IF EXISTS dg_orders_delivery_payment_status_check;
ALTER TABLE public.dg_orders
  ADD CONSTRAINT dg_orders_delivery_payment_status_check
  CHECK (delivery_payment_status IN ('cod', 'pending', 'partial', 'paid', 'waived', 'failed'));
ALTER TABLE public.dg_orders
  DROP CONSTRAINT IF EXISTS dg_orders_delivery_amounts_nonnegative;
ALTER TABLE public.dg_orders
  ADD CONSTRAINT dg_orders_delivery_amounts_nonnegative
  CHECK (delivery_prepayment_amount >= 0 AND delivery_amount_due >= 0);

CREATE TABLE IF NOT EXISTS public.dg_delivery_prepayments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES public.dg_orders(id) ON DELETE CASCADE,
  courier_provider text NOT NULL DEFAULT 'speedaf',
  status text NOT NULL DEFAULT 'paid',
  payment_method text NOT NULL DEFAULT 'mpesa',
  payment_reference text NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'KES',
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE RESTRICT,
  money_transaction_id uuid REFERENCES public.transactions(id) ON DELETE SET NULL,
  due_on_delivery numeric NOT NULL DEFAULT 0 CHECK (due_on_delivery >= 0),
  courier_tracking_number text,
  paid_at timestamptz NOT NULL DEFAULT now(),
  dispatched_at timestamptz,
  delivered_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, payment_reference)
);

ALTER TABLE public.dg_delivery_prepayments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owner manages delivery prepayments" ON public.dg_delivery_prepayments;
CREATE POLICY "owner manages delivery prepayments"
  ON public.dg_delivery_prepayments FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE INDEX IF NOT EXISTS dg_delivery_prepayments_user_paid_at_idx
  ON public.dg_delivery_prepayments (user_id, paid_at DESC);
CREATE INDEX IF NOT EXISTS dg_delivery_prepayments_order_idx
  ON public.dg_delivery_prepayments (order_id);
CREATE INDEX IF NOT EXISTS dg_delivery_prepayments_provider_status_idx
  ON public.dg_delivery_prepayments (user_id, courier_provider, status);

CREATE OR REPLACE FUNCTION public.dg_record_delivery_prepayment(
  p_order_id uuid,
  p_amount numeric,
  p_courier_provider text,
  p_payment_method text,
  p_payment_reference text,
  p_account_id uuid,
  p_due_on_delivery numeric DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_order public.dg_orders%ROWTYPE;
  v_account public.accounts%ROWTYPE;
  v_existing public.dg_delivery_prepayments%ROWTYPE;
  v_ledger_id uuid;
  v_transaction_id uuid;
  v_paid numeric;
  v_due numeric;
  v_status text;
  v_provider text := lower(coalesce(nullif(trim(p_courier_provider), ''), 'speedaf'));
  v_method text := lower(coalesce(nullif(trim(p_payment_method), ''), 'mpesa'));
  v_reference text := trim(coalesce(p_payment_reference, ''));
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN RAISE EXCEPTION 'Prepayment amount must be greater than zero'; END IF;
  IF v_reference = '' THEN RAISE EXCEPTION 'Courier payment reference is required'; END IF;
  IF v_provider NOT IN ('speedaf', 'other') THEN RAISE EXCEPTION 'Unsupported courier provider'; END IF;
  IF v_method NOT IN ('mpesa', 'card', 'bank_transfer', 'cash') THEN RAISE EXCEPTION 'Unsupported payment method'; END IF;

  SELECT * INTO v_order FROM public.dg_orders
  WHERE id = p_order_id AND user_id = v_user_id AND deleted_at IS NULL FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found or unavailable'; END IF;

  SELECT * INTO v_account FROM public.accounts
  WHERE id = p_account_id AND user_id = v_user_id AND status = 'active' AND deleted_at IS NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'Receiving account not found'; END IF;
  IF lower(coalesce(v_account.currency, 'KES')) <> lower(coalesce(v_order.currency, 'KES')) THEN
    RAISE EXCEPTION 'Courier prepayment currency must match the order currency';
  END IF;

  SELECT * INTO v_existing FROM public.dg_delivery_prepayments
  WHERE user_id = v_user_id AND payment_reference = v_reference;
  IF FOUND THEN
    IF v_existing.order_id <> p_order_id OR v_existing.amount <> p_amount THEN
      RAISE EXCEPTION 'Courier payment reference already belongs to another payment';
    END IF;
    RETURN jsonb_build_object(
      'status', 'already_recorded', 'ledgerId', v_existing.id,
      'moneyTransactionId', v_existing.money_transaction_id,
      'amountPaid', v_existing.amount, 'amountDue', v_existing.due_on_delivery
    );
  END IF;

  INSERT INTO public.transactions (
    user_id, account_id, type, amount, occurred_at, category, source, description, reference,
    status, financial_scope, business_name, income_type, flow_type
  ) VALUES (
    v_user_id, p_account_id, 'income', p_amount, now(), 'Courier prepayment',
    initcap(v_provider) || ' delivery prepayment',
    'Courier prepayment for ' || v_order.order_number,
    'DG_DELIVERY:' || v_order.order_number || ':' || v_reference,
    'posted', 'business', 'DailyGear', 'delivery_prepayment', 'delivery_prepayment'
  ) RETURNING id INTO v_transaction_id;

  INSERT INTO public.dg_delivery_prepayments (
    user_id, order_id, courier_provider, status, payment_method, payment_reference,
    amount, currency, account_id, money_transaction_id, due_on_delivery, notes
  ) VALUES (
    v_user_id, p_order_id, v_provider, 'paid', v_method, v_reference, p_amount,
    coalesce(v_order.currency, 'KES'), p_account_id, v_transaction_id,
    coalesce(p_due_on_delivery, greatest(v_order.total - p_amount, 0)), left(p_notes, 800)
  ) RETURNING id INTO v_ledger_id;

  SELECT coalesce(sum(amount) FILTER (WHERE status = 'paid'), 0) INTO v_paid
  FROM public.dg_delivery_prepayments WHERE order_id = p_order_id;
  v_due := greatest(v_order.total - v_paid, 0);
  v_status := CASE
    WHEN v_due = 0 THEN 'paid'
    WHEN v_paid > 0 THEN 'partial'
    ELSE 'pending'
  END;

  UPDATE public.dg_delivery_prepayments
  SET due_on_delivery = v_due, updated_at = now()
  WHERE id = v_ledger_id;
  UPDATE public.dg_orders
  SET delivery_payment_status = v_status,
      delivery_prepayment_amount = v_paid,
      delivery_amount_due = v_due,
      delivery_provider = v_provider,
      updated_at = now()
  WHERE id = p_order_id;

  INSERT INTO public.dg_order_events (user_id, order_id, type, title, body)
  VALUES (
    v_user_id, p_order_id, 'payment', 'Courier prepayment recorded',
    concat(initcap(v_provider), ' prepayment ', v_reference, ' · ', v_order.currency, ' ', p_amount::text,
      ' received · amount due on delivery ', v_order.currency, ' ', v_due::text)
  );

  RETURN jsonb_build_object(
    'status', 'recorded', 'ledgerId', v_ledger_id, 'moneyTransactionId', v_transaction_id,
    'amountPaid', v_paid, 'amountDue', v_due, 'provider', v_provider
  );
END;
$$;

REVOKE ALL ON FUNCTION public.dg_record_delivery_prepayment(uuid,numeric,text,text,text,uuid,numeric,text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.dg_record_delivery_prepayment(uuid,numeric,text,text,text,uuid,numeric,text) TO authenticated;

-- The goal-account validator is a trigger function, not an API function.
REVOKE ALL ON FUNCTION public.validate_goal_account_owner() FROM public, anon, authenticated;
-- Existing owner-checked admin RPCs run with caller RLS and auth.uid().
ALTER FUNCTION public.dg_confirm_order_payment(uuid,uuid,numeric,text,timestamptz,text) SECURITY INVOKER;
ALTER FUNCTION public.dg_record_order_fulfilment(uuid,numeric,numeric,numeric,numeric,uuid,boolean,numeric,uuid,text,dg_order_status) SECURITY INVOKER;
ALTER FUNCTION public.dg_record_order_fulfilment(uuid,numeric,numeric,numeric,uuid,text,dg_order_status) SECURITY INVOKER;
ALTER FUNCTION public.dg_refund_or_void_order_payment(uuid,text,uuid,numeric,text,text) SECURITY INVOKER;
ALTER FUNCTION public.dg_update_admin_order(uuid,dg_order_status,dg_payment_status,text,text,text,text,text,text,text,text,text,text,text,jsonb) SECURITY INVOKER;

COMMENT ON TABLE public.dg_delivery_prepayments IS 'Separate courier/Speedaf customer prepayment ledger; every posted row links to one Money Center income transaction.';
COMMENT ON FUNCTION public.dg_record_delivery_prepayment IS 'Atomically records an owner-authorized courier prepayment and its Money Center receipt.';
