CREATE OR REPLACE FUNCTION public.dg_guard_order_payment_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.payment_status IN ('paid', 'partial')
     AND NOT EXISTS (
       SELECT 1 FROM public.dg_order_payments p
       WHERE p.order_id = NEW.id AND p.user_id = NEW.user_id
     ) THEN
    RAISE EXCEPTION 'Payment status requires an order-linked payment record; use Confirm paid instead of editing the order directly';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS dg_guard_order_payment_status_trigger ON public.dg_orders;
CREATE TRIGGER dg_guard_order_payment_status_trigger
  BEFORE INSERT OR UPDATE OF payment_status ON public.dg_orders
  FOR EACH ROW EXECUTE FUNCTION public.dg_guard_order_payment_status();

REVOKE ALL ON FUNCTION public.dg_guard_order_payment_status() FROM PUBLIC;
