-- Expected Money remains a planning/receivable layer. Settlement atomically
-- creates exactly one authoritative Money Center income transaction and links it.
CREATE UNIQUE INDEX IF NOT EXISTS expected_money_received_transaction_unique_idx
  ON public.expected_money (received_transaction_id)
  WHERE received_transaction_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.settle_expected_money(
  p_expected_id uuid,
  p_account_id uuid,
  p_occurred_at timestamptz DEFAULT now()
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_expected public.expected_money%ROWTYPE;
  v_account public.accounts%ROWTYPE;
  v_existing_transaction uuid;
  v_transaction_id uuid;
  v_scope text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO v_expected
  FROM public.expected_money
  WHERE id = p_expected_id
    AND user_id = auth.uid()
    AND deleted_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Expected Money item not found';
  END IF;

  IF v_expected.status = 'received' AND v_expected.received_transaction_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'status', 'already_settled',
      'expectedId', v_expected.id,
      'transactionId', v_expected.received_transaction_id
    );
  END IF;

  IF v_expected.status = 'cancelled' THEN
    RAISE EXCEPTION 'Cancelled Expected Money cannot be settled';
  END IF;

  IF v_expected.status <> 'pending' OR v_expected.received_transaction_id IS NOT NULL THEN
    RAISE EXCEPTION 'Expected Money needs reconciliation before settlement';
  END IF;

  IF v_expected.amount <= 0 THEN
    RAISE EXCEPTION 'Expected Money amount must be greater than zero';
  END IF;

  SELECT * INTO v_account
  FROM public.accounts
  WHERE id = p_account_id
    AND user_id = auth.uid()
    AND deleted_at IS NULL
    AND status = 'active';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Destination account not found or inactive';
  END IF;

  v_scope := COALESCE(v_expected.financial_scope, 'personal');
  IF v_scope = 'business' THEN
    IF v_expected.business_id IS NULL
      OR v_account.financial_scope <> 'business'
      OR v_account.business_id IS DISTINCT FROM v_expected.business_id THEN
      RAISE EXCEPTION 'Business Expected Money must settle into the matching business account';
    END IF;
  ELSIF v_scope = 'personal' THEN
    IF v_account.financial_scope = 'business' OR v_account.business_id IS NOT NULL THEN
      RAISE EXCEPTION 'Personal Expected Money must settle into a personal account';
    END IF;
  ELSE
    RAISE EXCEPTION 'Unsupported Expected Money scope';
  END IF;

  SELECT id INTO v_existing_transaction
  FROM public.transactions
  WHERE user_id = auth.uid()
    AND reference = 'EXPECTED:' || v_expected.id::text
    AND deleted_at IS NULL
  LIMIT 1;

  IF v_existing_transaction IS NOT NULL THEN
    RAISE EXCEPTION 'Expected Money needs reconciliation: deterministic transaction already exists';
  END IF;

  INSERT INTO public.transactions (
    user_id,
    occurred_at,
    type,
    account_id,
    category,
    source,
    description,
    reference,
    amount,
    status,
    financial_scope,
    business_id,
    business_name,
    flow_type,
    income_type
  ) VALUES (
    auth.uid(),
    p_occurred_at,
    'income',
    v_account.id,
    NULL,
    v_expected.source,
    COALESCE(v_expected.description, 'Expected: ' || v_expected.source),
    'EXPECTED:' || v_expected.id::text,
    v_expected.amount,
    'posted',
    v_scope,
    CASE WHEN v_scope = 'business' THEN v_expected.business_id ELSE NULL END,
    CASE WHEN v_scope = 'business' THEN v_expected.business_name ELSE NULL END,
    'standard',
    'other'
  )
  RETURNING id INTO v_transaction_id;

  UPDATE public.expected_money
  SET status = 'received',
      account_id = v_account.id,
      received_transaction_id = v_transaction_id,
      updated_at = now()
  WHERE id = v_expected.id
    AND user_id = auth.uid()
    AND status = 'pending'
    AND received_transaction_id IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Expected Money changed during settlement';
  END IF;

  RETURN jsonb_build_object(
    'status', 'settled',
    'expectedId', v_expected.id,
    'transactionId', v_transaction_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.settle_expected_money(uuid, uuid, timestamptz) TO authenticated;

COMMENT ON FUNCTION public.settle_expected_money(uuid, uuid, timestamptz) IS
  'Atomically converts one pending Expected Money record into one authoritative posted income transaction with scope validation and deterministic duplicate protection.';
