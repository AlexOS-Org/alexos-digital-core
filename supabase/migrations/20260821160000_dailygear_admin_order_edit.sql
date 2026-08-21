-- Safe admin order editing for existing DailyGear orders.
-- This mutation intentionally edits order/customer metadata only. Line items,
-- totals and stock movements remain immutable after creation so an edit cannot
-- silently double-reserve or release inventory.

create or replace function public.dg_update_admin_order(
  p_order_id uuid,
  p_status public.dg_order_status,
  p_payment_status public.dg_payment_status,
  p_payment_method text default null,
  p_shipping_method text default null,
  p_shipping_address text default null,
  p_shipping_country text default null,
  p_shipping_county text default null,
  p_shipping_town text default null,
  p_shipping_address_details text default null,
  p_shipping_zone text default null,
  p_tracking_number text default null,
  p_notes text default null,
  p_internal_notes text default null,
  p_customer jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_order public.dg_orders%rowtype;
  v_customer_id uuid;
  v_title text;
  v_delivered_at timestamptz;
begin
  if v_user_id is null then
    raise exception 'You must be signed in.';
  end if;

  select * into v_order
  from public.dg_orders
  where id = p_order_id
    and user_id = v_user_id
    and deleted_at is null
  for update;

  if not found then
    raise exception 'Order not found or unavailable.';
  end if;

  if nullif(trim(coalesce(p_shipping_country, '')), '') is not null
     and lower(trim(p_shipping_country)) <> 'kenya' then
    raise exception 'DailyGear currently delivers within Kenya only.';
  end if;

  if lower(trim(coalesce(p_shipping_method, ''))) in ('delivery', 'shipping')
     and (
       nullif(trim(coalesce(p_shipping_county, '')), '') is null
       or nullif(trim(coalesce(p_shipping_town, '')), '') is null
     ) then
    raise exception 'Delivery orders require a county and town or area.';
  end if;

  v_customer_id := v_order.customer_id;
  if v_customer_id is not null and jsonb_typeof(coalesce(p_customer, '{}'::jsonb)) = 'object' then
    update public.dg_customers
    set first_name = coalesce(nullif(left(p_customer->>'first_name', 80), ''), first_name),
        last_name = nullif(left(p_customer->>'last_name', 80), ''),
        email = nullif(left(p_customer->>'email', 160), ''),
        phone = nullif(left(p_customer->>'phone', 40), ''),
        address = nullif(left(p_customer->>'address', 400), ''),
        city = nullif(left(p_customer->>'city', 100), ''),
        country = coalesce(nullif(left(p_customer->>'country', 80), ''), country),
        county = nullif(left(p_customer->>'county', 100), ''),
        town = nullif(left(p_customer->>'town', 100), ''),
        delivery_details = nullif(left(p_customer->>'delivery_details', 500), ''),
        notes = nullif(left(p_customer->>'notes', 800), ''),
        updated_at = now()
    where id = v_customer_id
      and user_id = v_user_id;
  end if;

  v_delivered_at := case
    when p_status = 'delivered' then coalesce(v_order.delivered_at, now())
    else null
  end;

  update public.dg_orders
  set status = p_status,
      payment_status = p_payment_status,
      payment_method = nullif(left(p_payment_method, 80), ''),
      shipping_method = nullif(left(p_shipping_method, 80), ''),
      shipping_address = nullif(left(p_shipping_address, 400), ''),
      shipping_country = nullif(left(p_shipping_country, 80), ''),
      shipping_county = nullif(left(p_shipping_county, 100), ''),
      shipping_town = nullif(left(p_shipping_town, 100), ''),
      shipping_address_details = nullif(left(p_shipping_address_details, 500), ''),
      shipping_zone = nullif(left(p_shipping_zone, 100), ''),
      tracking_number = nullif(left(p_tracking_number, 120), ''),
      notes = nullif(left(p_notes, 800), ''),
      internal_notes = nullif(left(p_internal_notes, 1200), ''),
      delivered_at = v_delivered_at,
      updated_at = now()
  where id = p_order_id
    and user_id = v_user_id;

  v_title := case
    when v_order.status is distinct from p_status
      then 'Order status updated to ' || replace(p_status::text, '_', ' ')
    when v_order.payment_status is distinct from p_payment_status
      then 'Payment status updated to ' || replace(p_payment_status::text, '_', ' ')
    else 'Order details updated'
  end;

  insert into public.dg_order_events (user_id, order_id, type, title, body)
  values (
    v_user_id,
    p_order_id,
    'updated',
    v_title,
    'Customer, delivery, payment or fulfilment details were updated. Line items, totals and stock history were preserved.'
  );

  return jsonb_build_object(
    'orderId', p_order_id,
    'status', p_status,
    'paymentStatus', p_payment_status,
    'total', v_order.total
  );
end;
$$;

revoke execute on function public.dg_update_admin_order(
  uuid,
  public.dg_order_status,
  public.dg_payment_status,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  jsonb
) from public, anon;
grant execute on function public.dg_update_admin_order(
  uuid,
  public.dg_order_status,
  public.dg_payment_status,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  jsonb
) to authenticated;
