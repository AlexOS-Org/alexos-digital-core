-- DailyGear order Trash retention.
-- Orders remain reversible for 14 days; permanent purge is restricted to the
-- scheduled service-role job. Paid orders must use the existing refund/void flow first.

ALTER TABLE public.dg_orders
  ADD COLUMN IF NOT EXISTS purge_after timestamptz;

UPDATE public.dg_orders
SET purge_after = deleted_at + interval '14 days'
WHERE deleted_at IS NOT NULL
  AND purge_after IS NULL;

CREATE INDEX IF NOT EXISTS dg_orders_trash_retention_idx
  ON public.dg_orders (purge_after)
  WHERE deleted_at IS NOT NULL;

CREATE OR REPLACE FUNCTION public.dg_move_order_to_trash(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.dg_orders%ROWTYPE;
BEGIN
  SELECT * INTO v_order
  FROM public.dg_orders
  WHERE id = p_order_id
    AND user_id = auth.uid()
    AND deleted_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found or already in Trash';
  END IF;

  IF v_order.payment_status NOT IN ('unpaid', 'refunded') THEN
    RAISE EXCEPTION 'Paid or partially paid orders must be refunded or voided before moving to Trash';
  END IF;

  UPDATE public.dg_orders
  SET deleted_at = now(),
      purge_after = now() + interval '14 days',
      updated_at = now()
  WHERE id = p_order_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.dg_restore_order_from_trash(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.dg_orders
  SET deleted_at = NULL,
      purge_after = NULL,
      updated_at = now()
  WHERE id = p_order_id
    AND user_id = auth.uid()
    AND deleted_at IS NOT NULL
    AND purge_after > now();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found, already purged, or retention expired';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.dg_purge_expired_order_trash()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted integer;
BEGIN
  DELETE FROM public.dg_orders
  WHERE deleted_at IS NOT NULL
    AND purge_after IS NOT NULL
    AND purge_after <= now();

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

REVOKE ALL ON FUNCTION public.dg_move_order_to_trash(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.dg_restore_order_from_trash(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.dg_purge_expired_order_trash() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.dg_move_order_to_trash(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.dg_restore_order_from_trash(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.dg_purge_expired_order_trash() TO service_role;
