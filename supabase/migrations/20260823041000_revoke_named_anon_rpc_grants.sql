-- Explicitly revoke named PostgREST roles. REVOKE FROM PUBLIC does not
-- remove grants made directly to anon or authenticated.

REVOKE ALL ON FUNCTION public.dg_confirm_order_payment(uuid, uuid, numeric, text, timestamptz, text) FROM anon;
REVOKE ALL ON FUNCTION public.dg_guard_order_payment_status() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.dg_refund_or_void_order_payment(uuid, text, uuid, numeric, text, text) FROM anon;
REVOKE ALL ON FUNCTION public.money_post_due_salary_schedules(date) FROM anon, authenticated;
