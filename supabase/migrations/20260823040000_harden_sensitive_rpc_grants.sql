-- Harden RPC execution privileges without changing business data.
-- Public/anon callers must not be able to invoke payment, fulfilment,
-- refund, admin-order, or salary-posting security-definer functions.

REVOKE ALL ON FUNCTION public.dg_confirm_order_payment(uuid, uuid, numeric, timestamptz, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.dg_confirm_order_payment(uuid, uuid, numeric, timestamptz, text) TO authenticated;

REVOKE ALL ON FUNCTION public.dg_guard_order_payment_status() FROM PUBLIC;

REVOKE ALL ON FUNCTION public.dg_record_order_fulfilment(uuid, numeric, numeric, numeric, uuid, text, public.dg_order_status) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.dg_record_order_fulfilment(uuid, numeric, numeric, numeric, uuid, text, public.dg_order_status) TO authenticated;

REVOKE ALL ON FUNCTION public.dg_record_order_fulfilment(uuid, numeric, numeric, numeric, numeric, uuid, boolean, numeric, uuid, text, public.dg_order_status) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.dg_record_order_fulfilment(uuid, numeric, numeric, numeric, numeric, uuid, boolean, numeric, uuid, text, public.dg_order_status) TO authenticated;

REVOKE ALL ON FUNCTION public.dg_refund_or_void_order_payment(uuid, text, uuid, numeric, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.dg_refund_or_void_order_payment(uuid, text, uuid, numeric, text, text) TO authenticated;

REVOKE ALL ON FUNCTION public.dg_update_admin_order(uuid, public.dg_order_status, public.dg_payment_status, text, text, text, text, text, text, text, text, text, text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.dg_update_admin_order(uuid, public.dg_order_status, public.dg_payment_status, text, text, text, text, text, text, text, text, text, text, text, jsonb) TO authenticated;

REVOKE ALL ON FUNCTION public.money_post_due_salary_schedules(date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.money_post_due_salary_schedules(date) TO service_role;
