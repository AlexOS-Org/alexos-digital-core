-- DailyGear checkout and payment hardening.
-- Additive and idempotent: preserves existing pricing and Money Center math.

ALTER TABLE public.dg_orders
  ADD COLUMN IF NOT EXISTS mpesa_reference text;

ALTER TABLE public.dg_orders
  DROP CONSTRAINT IF EXISTS dg_orders_mpesa_reference_length;
ALTER TABLE public.dg_orders
  ADD CONSTRAINT dg_orders_mpesa_reference_length
  CHECK (mpesa_reference IS NULL OR char_length(mpesa_reference) <= 80);

-- Server-side funnel isolation. A published funnel may contain optional
-- configured offers, but every primary line must be its advertised product.
CREATE OR REPLACE FUNCTION public.dg_validate_funnel_order_items()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_funnel_id uuid;
  v_primary_product_id uuid;
BEGIN
  SELECT o.funnel_id INTO v_funnel_id
  FROM public.dg_orders o
  WHERE o.id = COALESCE(NEW.order_id, OLD.order_id);

  IF v_funnel_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT f.product_id INTO v_primary_product_id
  FROM public.dg_funnels f
  WHERE f.id = v_funnel_id AND f.status = 'published';

  IF v_primary_product_id IS NULL THEN
    RAISE EXCEPTION 'This sales experience is no longer available.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.dg_order_items i
    WHERE i.order_id = COALESCE(NEW.order_id, OLD.order_id)
      AND COALESCE(i.offer_role, 'primary') = 'primary'
      AND i.product_id <> v_primary_product_id
  ) THEN
    RAISE EXCEPTION 'This campaign checkout only accepts its advertised product.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.dg_order_items i
    WHERE i.order_id = COALESCE(NEW.order_id, OLD.order_id)
      AND COALESCE(i.offer_role, 'primary') = 'primary'
      AND i.product_id = v_primary_product_id
  ) THEN
    RAISE EXCEPTION 'The advertised product is required in this campaign checkout.';
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS dg_validate_funnel_order_items_deferred ON public.dg_order_items;
CREATE CONSTRAINT TRIGGER dg_validate_funnel_order_items_deferred
AFTER INSERT OR UPDATE OR DELETE ON public.dg_order_items
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION public.dg_validate_funnel_order_items();

REVOKE ALL ON FUNCTION public.dg_validate_funnel_order_items() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.dg_validate_funnel_order_items() TO service_role;

-- Automatic, idempotent settlement for a successful Daraja STK callback.
-- The callback receipt is the unique payment reference. A successful online
-- payment also earns free delivery only after the callback amount is matched.
CREATE OR REPLACE FUNCTION public.dg_settle_mpesa_stk_success(p_attempt_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_attempt record;
  v_order record;
  v_account record;
  v_existing record;
  v_tx_id uuid;
  v_payment_id uuid;
  v_paid numeric;
BEGIN
  SELECT * INTO v_attempt
  FROM public.dg_mpesa_stk_attempts
  WHERE id = p_attempt_id AND status = 'success'
  FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('status', 'not_ready'); END IF;

  SELECT * INTO v_order
  FROM public.dg_orders
  WHERE id = v_attempt.order_id AND deleted_at IS NULL
  FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('status', 'order_missing'); END IF;
  IF nullif(trim(v_attempt.mpesa_receipt_number), '') IS NULL THEN
    RETURN jsonb_build_object('status', 'awaiting_receipt');
  END IF;
  IF v_attempt.callback_amount IS NOT NULL AND v_attempt.callback_amount <> v_attempt.amount THEN
    RETURN jsonb_build_object('status', 'amount_mismatch');
  END IF;

  SELECT * INTO v_account
  FROM public.accounts
  WHERE user_id = v_order.user_id
    AND status = 'active' AND deleted_at IS NULL
    AND (lower(name) LIKE '%m-pesa%' OR lower(name) LIKE '%mpesa%' OR type = 'mobile_money')
  ORDER BY CASE WHEN lower(name) LIKE '%m-pesa%' OR lower(name) LIKE '%mpesa%' THEN 0 ELSE 1 END,
           created_at ASC
  LIMIT 1;
  IF NOT FOUND THEN RETURN jsonb_build_object('status', 'awaiting_money_account'); END IF;

  SELECT id, order_id, amount, account_id INTO v_existing
  FROM public.dg_order_payments
  WHERE user_id = v_order.user_id
    AND transaction_id = trim(v_attempt.mpesa_receipt_number);
  IF FOUND THEN
    RETURN jsonb_build_object('status', 'already_settled', 'paymentId', v_existing.id);
  END IF;

  INSERT INTO public.transactions (
    user_id, account_id, type, amount, occurred_at, category, source, description, reference,
    status, financial_scope, business_name, income_type, flow_type
  ) VALUES (
    v_order.user_id, v_account.id, 'income', v_attempt.amount, now(), NULL, 'Customer Payment',
    'M-Pesa STK receipt for ' || v_order.order_number,
    'DG_MPESA:' || trim(v_attempt.mpesa_receipt_number), 'posted', 'business',
    'DailyGear', 'sales_revenue', 'standard'
  ) RETURNING id INTO v_tx_id;

  INSERT INTO public.dg_order_payments (
    user_id, order_id, account_id, money_transaction_id, amount, transaction_id,
    payment_method, paid_at, notes
  ) VALUES (
    v_order.user_id, v_order.id, v_account.id, v_tx_id, v_attempt.amount,
    trim(v_attempt.mpesa_receipt_number), 'mpesa_stk', now(), 'Automatic Daraja STK settlement'
  ) RETURNING id INTO v_payment_id;

  IF coalesce(v_order.shipping_fee, 0) > 0 THEN
    UPDATE public.dg_orders
    SET shipping_fee = 0, total = subtotal + discount + tax, updated_at = now()
    WHERE id = v_order.id;
  END IF;

  SELECT coalesce(sum(amount), 0) INTO v_paid
  FROM public.dg_order_payments WHERE order_id = v_order.id;
  UPDATE public.dg_orders
  SET payment_status = CASE WHEN v_paid >= total THEN 'paid'::public.dg_payment_status ELSE 'partial'::public.dg_payment_status END,
      updated_at = now()
  WHERE id = v_order.id;

  INSERT INTO public.dg_order_events (user_id, order_id, type, title, body)
  VALUES (
    v_order.user_id, v_order.id, 'payment', 'M-Pesa payment settled',
    concat('KES ', to_char(v_attempt.amount, 'FM999999990.00'), ' received into ', v_account.name,
      ' · receipt ', trim(v_attempt.mpesa_receipt_number), ' · online delivery benefit applied')
  );

  RETURN jsonb_build_object('status', 'settled', 'paymentId', v_payment_id, 'moneyTransactionId', v_tx_id);
END;
$$;

REVOKE ALL ON FUNCTION public.dg_settle_mpesa_stk_success(uuid) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.dg_settle_mpesa_stk_success(uuid) TO service_role;
