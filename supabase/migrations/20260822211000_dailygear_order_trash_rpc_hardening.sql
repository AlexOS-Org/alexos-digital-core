-- Authenticated Trash RPCs rely on the existing owner RLS policy and do not need
-- elevated privileges. Keep only the scheduled purge function service-role-only.

ALTER FUNCTION public.dg_move_order_to_trash(uuid) SECURITY INVOKER;
ALTER FUNCTION public.dg_restore_order_from_trash(uuid) SECURITY INVOKER;
