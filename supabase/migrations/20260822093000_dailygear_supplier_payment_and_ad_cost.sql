-- DailyGear: separate supplier cost from actual supplier cash payment,
-- and support manual per-order advertising costs.
-- Existing rows are preserved. Existing posted order expenses are marked paid;
-- unposted supplier costs remain unpaid.

ALTER TABLE public.dg_order_expenses
  DROP CONSTRAINT IF EXISTS dg_order_expenses_cost_type_check;

ALTER TABLE public.dg_order_expenses
  ADD CONSTRAINT dg_order_expenses_cost_type_check
  CHECK (cost_type IN ('purchase_cost', 'delivery', 'advertising', 'other'));

ALTER TABLE public.dg_order_expenses
  ADD COLUMN IF NOT EXISTS cash_paid boolean NOT NULL DEFAULT false;

UPDATE public.dg_order_expenses
SET cash_paid = (money_transaction_id IS NOT NULL)
WHERE cash_paid IS DISTINCT FROM (money_transaction_id IS NOT NULL);

CREATE OR REPLACE FUNCTION public.dg_record_order_fulfilment(
  p_order_id uuid,
  p_purchase_cost numeric DEFAULT 0,
  p_delivery_cost numeric DEFAULT 0,
  p_advertising_cost numeric DEFAULT 0,
  p_other_cost numeric DEFAULT 0,
  p_account_id uuid DEFAULT NULL,
  p_supplier_paid boolean DEFAULT false,
  p_supplier_payment_amount numeric DEFAULT NULL,
  p_supplier_payment_account_id uuid DEFAULT NULL,
  p_other_description text DEFAULT NULL,
  p_next_status public.dg_order_status DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_order public.dg_orders%ROWTYPE;
  v_existing public.dg_order_expenses%ROWTYPE;
  v_cost jsonb;
  v_type text;
  v_amount numeric;
  v_description text;
  v_expense_type text;
  v_transaction_id uuid;
  v_has_existing boolean;
  v_status public.dg_order_status;
  v_costs jsonb := '[]'::jsonb;
  v_supplier_payment_amount numeric := COALESCE(p_supplier_payment_amount, p_purchase_cost, 0);
  v_account_for_cost uuid;
  v_should_post_cash boolean;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'You must be signed in.'; END IF;
  IF COALESCE(p_purchase_cost, 0) < 0
     OR COALESCE(p_delivery_cost, 0) < 0
     OR COALESCE(p_advertising_cost, 0) < 0
     OR COALESCE(p_other_cost, 0) < 0 THEN
    RAISE EXCEPTION 'Fulfilment costs cannot be negative.';
  END IF;
  IF p_supplier_paid AND v_supplier_payment_amount <= 0 THEN
    RAISE EXCEPTION 'Enter the actual supplier payment amount when supplier paid is Yes.';
  END IF;
  IF p_supplier_paid AND p_supplier_payment_account_id IS NULL THEN
    RAISE EXCEPTION 'Select the account used to pay the supplier when supplier paid is Yes.';
  END IF;
  IF (COALESCE(p_delivery_cost, 0) + COALESCE(p_advertising_cost, 0) + COALESCE(p_other_cost, 0)) > 0
     AND p_account_id IS NULL THEN
    RAISE EXCEPTION 'Select the Money Center account used for delivery, advertising, or other costs.';
  END IF;

  SELECT * INTO v_order
  FROM public.dg_orders
  WHERE id = p_order_id AND user_id = v_user_id AND deleted_at IS NULL
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found or unavailable.'; END IF;

  IF p_next_status IS NOT NULL THEN
    IF p_next_status NOT IN ('processing', 'packed') THEN
      RAISE EXCEPTION 'Fulfilment can only move an order to processing or packed.';
    END IF;
    IF v_order.status = 'new' AND p_next_status <> 'processing' THEN
      RAISE EXCEPTION 'A new order must move to processing before it can be packed.';
    END IF;
    IF v_order.status = 'processing' AND p_next_status <> 'packed' THEN
      RAISE EXCEPTION 'A processing order can only move to packed.';
    END IF;
    IF v_order.status NOT IN ('new', 'processing') THEN
      RAISE EXCEPTION 'Fulfilment costs cannot move a completed or cancelled order backward.';
    END IF;
  END IF;

  FOR v_cost IN
    SELECT value FROM jsonb_array_elements(
      jsonb_build_array(
        jsonb_build_object('cost_type', 'purchase_cost', 'amount', COALESCE(p_purchase_cost, 0), 'description', 'Purchase cost'),
        jsonb_build_object('cost_type', 'delivery', 'amount', COALESCE(p_delivery_cost, 0), 'description', 'Delivery cost'),
        jsonb_build_object('cost_type', 'advertising', 'amount', COALESCE(p_advertising_cost, 0), 'description', 'Advertising cost'),
        jsonb_build_object('cost_type', 'other', 'amount', COALESCE(p_other_cost, 0), 'description', COALESCE(NULLIF(left(p_other_description, 200), ''), 'Other fulfilment cost'))
      )
    )
  LOOP
    v_type := v_cost->>'cost_type';
    v_amount := (v_cost->>'amount')::numeric;
    v_description := v_cost->>'description';
    v_expense_type := CASE v_type
      WHEN 'purchase_cost' THEN 'cost_of_goods'
      WHEN 'delivery' THEN 'delivery'
      WHEN 'advertising' THEN 'advertising'
      ELSE 'other'
    END;
    v_should_post_cash := v_amount > 0 AND (v_type <> 'purchase_cost' OR p_supplier_paid);
    v_account_for_cost := CASE
      WHEN v_type = 'purchase_cost' AND p_supplier_paid THEN p_supplier_payment_account_id
      WHEN v_type = 'purchase_cost' THEN NULL
      ELSE p_account_id
    END;

    SELECT * INTO v_existing
    FROM public.dg_order_expenses
    WHERE order_id = p_order_id AND user_id = v_user_id AND cost_type = v_type
    FOR UPDATE;
    v_has_existing := FOUND;

    IF v_has_existing AND v_existing.money_transaction_id IS NOT NULL THEN
      IF v_existing.amount IS DISTINCT FROM v_amount
         OR v_existing.account_id IS DISTINCT FROM v_account_for_cost THEN
        RAISE EXCEPTION 'The % cost for this order is already posted. Void or correct it in Money Center instead of rewriting history.', v_type;
      END IF;
      v_costs := v_costs || jsonb_build_array(jsonb_build_object(
        'costType', v_type, 'amount', v_existing.amount, 'accountId', v_existing.account_id,
        'moneyTransactionId', v_existing.money_transaction_id, 'cashPaid', v_existing.cash_paid, 'posted', true
      ));
      CONTINUE;
    END IF;

    IF v_should_post_cash THEN
      PERFORM 1 FROM public.accounts
      WHERE id = v_account_for_cost AND user_id = v_user_id AND status = 'active' AND deleted_at IS NULL;
      IF NOT FOUND THEN RAISE EXCEPTION 'The selected Money Center account is unavailable.'; END IF;
    END IF;

    IF v_has_existing THEN
      UPDATE public.dg_order_expenses
      SET amount = v_amount, account_id = v_account_for_cost, description = v_description, updated_at = now()
      WHERE id = v_existing.id;
    ELSE
      INSERT INTO public.dg_order_expenses (user_id, order_id, cost_type, amount, account_id, description, cash_paid)
      VALUES (v_user_id, p_order_id, v_type, v_amount, v_account_for_cost, v_description, false);
    END IF;

    IF v_should_post_cash THEN
      INSERT INTO public.transactions (
        user_id, occurred_at, type, account_id, category, source, description, reference, amount,
        status, financial_scope, business_name, flow_type, principal_amount, interest_amount, expense_type
      ) VALUES (
        v_user_id, now(), 'expense', v_account_for_cost, v_description, 'DailyGear order fulfilment',
        format('%s — %s', v_order.order_number, v_description),
        format('%s:%s', v_order.order_number, v_type),
        v_amount, 'posted', 'business', 'DailyGear', 'standard', 0, 0, v_expense_type
      ) RETURNING id INTO v_transaction_id;

      UPDATE public.dg_order_expenses
      SET money_transaction_id = v_transaction_id, cash_paid = true, updated_at = now()
      WHERE order_id = p_order_id AND user_id = v_user_id AND cost_type = v_type;
    ELSE
      v_transaction_id := NULL;
    END IF;

    v_costs := v_costs || jsonb_build_array(jsonb_build_object(
      'costType', v_type, 'amount', v_amount, 'accountId', v_account_for_cost,
      'moneyTransactionId', v_transaction_id, 'cashPaid', v_transaction_id IS NOT NULL,
      'posted', v_transaction_id IS NOT NULL
    ));
  END LOOP;

  v_status := COALESCE(p_next_status, v_order.status);
  IF p_next_status IS NOT NULL THEN
    UPDATE public.dg_orders SET status = p_next_status, updated_at = now()
    WHERE id = p_order_id AND user_id = v_user_id;
  END IF;

  INSERT INTO public.dg_order_events (user_id, order_id, type, title, body)
  VALUES (
    v_user_id, p_order_id, 'updated', 'Fulfilment costs recorded',
    format('Costs were recorded. Supplier paid: %s. Each posted cost links to one Money Center expense.', CASE WHEN p_supplier_paid THEN 'yes' ELSE 'no' END)
  );

  RETURN jsonb_build_object('orderId', p_order_id, 'status', v_status, 'costs', v_costs, 'supplierPaid', p_supplier_paid, 'supplierPaymentAmount', CASE WHEN p_supplier_paid THEN v_supplier_payment_amount ELSE NULL END);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.dg_record_order_fulfilment(uuid, numeric, numeric, numeric, uuid, text, public.dg_order_status) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.dg_record_order_fulfilment(uuid, numeric, numeric, numeric, numeric, uuid, boolean, numeric, uuid, text, public.dg_order_status) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.dg_record_order_fulfilment(uuid, numeric, numeric, numeric, numeric, uuid, boolean, numeric, uuid, text, public.dg_order_status) TO authenticated;
