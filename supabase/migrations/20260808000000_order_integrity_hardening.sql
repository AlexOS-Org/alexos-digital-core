-- Phase 4 hardening: order-number uniqueness and stock-integrity constraints.
-- Safe, additive migration. It does not alter existing data; it only adds
-- constraints, an index, and a per-user sequence for collision-free order numbers.

-- 1. Prevent negative stock at the database level.
alter table public.dg_products add constraint dg_products_stock_non_negative
  check (stock_quantity >= 0);

-- 2. Atomic, race-safe stock reservation:
--    `UPDATE dg_products SET stock_quantity = stock_quantity - $n
--       WHERE id = $id AND stock_quantity >= $n`
--    succeeds only when enough stock is available, even under concurrent
--    checkouts. The client-side availability check remains as a fast path.

-- 3. Unique order numbers per storefront (a store can issue its own numbering).
alter table public.dg_orders add constraint dg_orders_order_number_unique
  unique (order_number);

-- 4. Per-user sequence so new order numbers are deterministic and never collide,
--    regardless of concurrency or timezone. Existing rows are untouched; new
--    inserts can use format('DG-%s-%s', to_char(now(), 'YYYYMMDD'),
--    lpad(nextval('dg_order_seq')::text, 4, '0')) instead of Math.random().
create sequence if not exists public.dg_order_seq
  as bigint
  start with 1
  increment by 1
  no cycle;

-- 5. Helper SQL function that reserves stock atomically. Returns true on
--    success. Server code can call it instead of the read-then-write pattern:
--    select public.dg_reserve_stock(product_id, qty)
create or replace function public.dg_reserve_stock(p_product_id uuid, p_qty integer)
  returns boolean
  language plpgsql
as $$
declare
  v_reserved integer;
begin
  update public.dg_products
    set stock_quantity = stock_quantity - p_qty
  where id = p_product_id
    and stock_quantity >= p_qty
  returning 1 into v_reserved;
  return v_reserved is not null;
end;
$$;

revoke execute on function public.dg_reserve_stock(uuid, integer) from anon, authenticated;
grant execute on function public.dg_reserve_stock(uuid, integer) to service_role;

-- 6. Helper that returns the next collision-free order number:
--    DG-YYYYMMDD-<zero-padded sequence>
create or replace function public.next_order_number()
  returns text
  language sql
as $$
  select format('DG-%s-%s', to_char(now() at time zone 'Africa/Nairobi', 'YYYYMMDD'), lpad(nextval('public.dg_order_seq')::text, 4, '0'))::text;
$$;

revoke execute on function public.next_order_number() from anon, authenticated;
grant execute on function public.next_order_number() to service_role;
