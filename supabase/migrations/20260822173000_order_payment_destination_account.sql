-- Extend the existing order-payment confirmation result so the UI can show
-- exactly where the customer receipt was posted. The underlying transaction
-- remains one order-linked income entry per unique payment reference.
DROP FUNCTION IF EXISTS public.dg_confirm_order_payment(uuid, uuid, numeric, text, timestamptz, text);

CREATE FUNCTION public.dg_confirm_order_payment(
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
  receipt_number text,
  account_name text
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
    RETURN QUERY SELECT v_payment.id, v_payment.money_transaction_id, v_order.order_number,
      v_total_paid, v_order.total, v_status, 'RC-' || v_order.order_number, v_account.name;
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

  SELECT COALESCE(sum(amount), 0) INTO v_total_paid
    FROM public.dg_order_payments WHERE order_id = p_order_id;
  v_status := CASE WHEN v_total_paid >= v_order.total THEN 'paid'::public.dg_payment_status ELSE 'partial'::public.dg_payment_status END;
  UPDATE public.dg_orders SET payment_status = v_status, updated_at = now() WHERE id = p_order_id;

  INSERT INTO public.dg_order_events (user_id, order_id, type, title, body)
  VALUES (v_user_id, p_order_id, 'payment', 'Payment confirmed',
    concat('KES ', to_char(p_amount, 'FM999999990.00'), ' received into ', v_account.name,
      ' · transaction ', trim(p_transaction_id)));

  RETURN QUERY SELECT v_payment.id, v_tx.id, v_order.order_number,
    v_total_paid, v_order.total, v_status, 'RC-' || v_order.order_number, v_account.name;
END;
$$;

REVOKE ALL ON FUNCTION public.dg_confirm_order_payment(uuid, uuid, numeric, text, timestamptz, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.dg_confirm_order_payment(uuid, uuid, numeric, text, timestamptz, text) TO authenticated;
