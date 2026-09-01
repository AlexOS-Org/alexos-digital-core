-- PROPOSED — NOT APPLIED TO PRODUCTION.
--
-- Defense-in-depth for DailyGear normal product orders. The Phase 2
-- application-level guard already blocks KES 0 lines before the guest-order
-- RPC runs. This additive trigger is the database fallback so a privileged
-- caller cannot create a zero-value product order directly.
--
-- It only rejects public checkout channels (online_store / funnel). It does not
-- block administrative or manual adjustments on orders outside those channels,
-- and it does not alter any existing table, grant, policy or migration history.

create or replace function public.dg_guard_positive_order_price()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_channel text;
begin
  if new.quantity is not null
     and new.quantity > 0
     and (new.unit_price is null or new.unit_price <= 0) then
    select channel into v_channel
    from public.dg_orders
    where id = new.order_id
    limit 1;

    if v_channel in ('online_store', 'funnel') then
      raise exception 'A product cannot be sold with a zero or negative unit price.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists dg_positive_order_price_guard on public.dg_order_items;

create trigger dg_positive_order_price_guard
before insert or update of unit_price, quantity, order_id on public.dg_order_items
for each row execute function public.dg_guard_positive_order_price();

comment on function public.dg_guard_positive_order_price() is
  'Rejects zero/negative unit prices on public DailyGear order lines. Proposed for review; not applied.';
