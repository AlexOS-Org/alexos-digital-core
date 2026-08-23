-- Harden SECURITY DEFINER RPC resolution without changing grants or business behavior.
-- These RPCs retain authenticated execution because the application calls them
-- for owner-admin payment, fulfilment, refund, and order-edit flows.

alter function public.dg_confirm_order_payment(
  uuid, uuid, numeric, text, timestamptz, text
) set search_path = pg_catalog, public;

alter function public.dg_record_order_fulfilment(
  uuid, numeric, numeric, numeric, numeric, uuid, boolean, numeric, uuid, text, public.dg_order_status
) set search_path = pg_catalog, public;

alter function public.dg_record_order_fulfilment(
  uuid, numeric, numeric, numeric, uuid, text, public.dg_order_status
) set search_path = pg_catalog, public;

alter function public.dg_refund_or_void_order_payment(
  uuid, text, uuid, numeric, text, text
) set search_path = pg_catalog, public;

alter function public.dg_update_admin_order(
  uuid, public.dg_order_status, public.dg_payment_status, text, text, text,
  text, text, text, text, text, text, text, text, jsonb
) set search_path = pg_catalog, public;
