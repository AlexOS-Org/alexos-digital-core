-- Harden SECURITY DEFINER-style database functions against search_path hijacking.
ALTER FUNCTION public.dg_reserve_stock(uuid, integer)
  SET search_path = public, pg_catalog;

ALTER FUNCTION public.next_order_number()
  SET search_path = public, pg_catalog;
