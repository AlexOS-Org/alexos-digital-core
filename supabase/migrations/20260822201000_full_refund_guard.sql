CREATE OR REPLACE FUNCTION public.dg_refund_or_void_order_payment(
  p_order_id uuid,
  p_mode text,
  p_refund_account_id uuid DEFAULT NULL,
  p_refund_amount numeric DEFAULT NULL,
  p_refund_transaction_id text DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS TABLE(order_number text, mode text, amount_reversed numeric, refund_transaction_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_order public.dg_orders%ROWTYPE;
  v_payment record;
  v_amount numeric;
  v_refund_tx uuid;
  v_reference text;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF p_mode NOT IN ('void', 'refund') THEN RAISE EXCEPTION 'Mode must be void or refund'; END IF;
  SELECT * INTO v_order FROM public.dg_orders WHERE id = p_order_id AND user_id = v_user_id AND deleted_at IS NULL FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found'; END IF;
  IF v_order.payment_status NOT IN ('paid', 'partial') THEN RAISE EXCEPTION 'Only paid or partially paid orders can be reversed'; END IF;
  SELECT p.id, p.amount, p.money_transaction_id, p.transaction_id INTO v_payment FROM public.dg_order_payments p WHERE p.order_id = p_order_id AND p.user_id = v_user_id ORDER BY p.paid_at DESC LIMIT 1;
  IF NOT FOUND THEN RAISE EXCEPTION 'No linked customer payment found'; END IF;
  v_amount := COALESCE(p_refund_amount, v_payment.amount);
  IF v_amount <> v_payment.amount THEN RAISE EXCEPTION 'Only full refunds are supported until partial-payment reversal is implemented'; END IF;
  IF p_mode = 'refund' THEN
    IF p_refund_account_id IS NULL THEN RAISE EXCEPTION 'Refund account is required'; END IF;
    IF nullif(trim(p_refund_transaction_id), '') IS NULL THEN RAISE EXCEPTION 'Refund transaction reference is required'; END IF;
    IF NOT EXISTS (SELECT 1 FROM public.accounts a WHERE a.id = p_refund_account_id AND a.user_id = v_user_id AND a.deleted_at IS NULL) THEN RAISE EXCEPTION 'Refund account not found'; END IF;
    v_reference := 'DG_REFUND:' || v_order.order_number || ':' || trim(p_refund_transaction_id);
    IF EXISTS (SELECT 1 FROM public.transactions t WHERE t.user_id = v_user_id AND t.reference = v_reference) THEN RAISE EXCEPTION 'Refund reference already used'; END IF;
    INSERT INTO public.transactions (user_id, account_id, type, amount, occurred_at, category, source, description, reference, status, financial_scope, business_name, flow_type)
    VALUES (v_user_id, p_refund_account_id, 'expense', v_amount, now(), 'Customer refund', 'DailyGear', 'Refund for ' || v_order.order_number || COALESCE(' · ' || p_notes, ''), v_reference, 'posted', 'business', 'DailyGear', 'standard')
    RETURNING id INTO v_refund_tx;
  END IF;
  UPDATE public.transactions SET status = 'void', deleted_at = COALESCE(deleted_at, now()) WHERE id = v_payment.money_transaction_id AND user_id = v_user_id AND status = 'posted';
  UPDATE public.dg_orders SET payment_status = 'refunded', updated_at = now() WHERE id = p_order_id;
  INSERT INTO public.dg_order_events (user_id, order_id, type, title, body)
  VALUES (v_user_id, p_order_id, CASE WHEN p_mode = 'refund' THEN 'refund' ELSE 'payment' END, CASE WHEN p_mode = 'refund' THEN 'Payment refunded' ELSE 'Payment voided' END, concat('KES ', to_char(v_amount, 'FM999999990.00'), ' ', p_mode, ' · original transaction ', v_payment.transaction_id));
  RETURN QUERY SELECT v_order.order_number, p_mode, v_amount, v_refund_tx;
END;
$$;
