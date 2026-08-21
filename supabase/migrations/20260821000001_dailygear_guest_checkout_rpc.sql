-- DailyGear guest checkout transaction RPC.
-- Keeps pricing, stock, customer upsert, order, items and audit events atomic.

-- One transaction for public checkout. The Worker calls this only with the
-- service-role client after validating the request shape; all money, stock and
-- availability values are read again inside the database.
create or replace function public.dg_create_guest_order(
  p_store_slug text,
  p_first_name text,
  p_last_name text,
  p_email text,
  p_phone text,
  p_address text,
  p_city text,
  p_notes text,
  p_payment_method text,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_store record;
  v_customer_id uuid;
  v_order_id uuid;
  v_order_number text;
  v_subtotal numeric := 0;
  v_shipping_fee numeric := 0;
  v_total numeric := 0;
  v_lines jsonb := '[]'::jsonb;
  v_item record;
  v_product record;
  v_variant record;
  v_unit_price numeric;
  v_unit_cost numeric;
  v_stock integer;
  v_line_name text;
  v_line_sku text;
  v_line_image text;
  v_reserved boolean;
begin
  if p_payment_method not in ('cod', 'mpesa', 'card', 'bank_transfer') then
    raise exception 'Unsupported payment method.';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Your cart is empty.';
  end if;

  select * into v_store
  from public.dg_storefronts
  where slug = p_store_slug
    and published = true
  limit 1;

  if not found then
    raise exception 'This store is not accepting orders right now.';
  end if;

  for v_item in
    select *
    from jsonb_to_recordset(p_items) as item(
      product_id uuid,
      variant_id uuid,
      quantity integer
    )
  loop
    if v_item.product_id is null or v_item.quantity is null or v_item.quantity < 1 then
      raise exception 'An item in your cart is invalid.';
    end if;

    select p.* into v_product
    from public.dg_products p
    where p.id = v_item.product_id
      and p.user_id = v_store.user_id
      and p.deleted_at is null
      and p.status = 'active'
      and p.availability_confirmed = true
    for update;

    if not found then
      raise exception 'One of the products is no longer available.';
    end if;

    if v_item.variant_id is not null then
      select v.* into v_variant
      from public.dg_product_variants v
      where v.id = v_item.variant_id
        and v.product_id = v_product.id
        and v.user_id = v_store.user_id
        and v.deleted_at is null
        and v.availability_confirmed = true
      for update;

      if not found then
        raise exception 'The selected option for % is no longer available.', v_product.name;
      end if;

      if v_variant.stock_quantity < v_item.quantity then
        raise exception 'Only % left of %.', v_variant.stock_quantity, v_variant.name;
      end if;

      v_unit_price := coalesce(v_variant.price, v_product.price);
      if v_variant.sale_price is not null
         and v_variant.sale_price > 0
         and v_variant.sale_price < v_unit_price then
        v_unit_price := v_variant.sale_price;
      end if;
      v_unit_cost := coalesce(v_variant.cost_price, v_product.cost_price, 0);
      v_line_name := v_product.name || ' — ' || v_variant.name;
      v_line_sku := coalesce(v_variant.sku, v_product.sku);
      v_line_image := v_variant.image_url;

      update public.dg_product_variants
      set stock_quantity = stock_quantity - v_item.quantity
      where id = v_variant.id
        and stock_quantity >= v_item.quantity
      returning true into v_reserved;

      if v_reserved is distinct from true then
        raise exception 'Stock changed while placing the order. Please try again.';
      end if;
    else
      if v_product.stock_quantity < v_item.quantity then
        raise exception 'Only % left of %.', v_product.stock_quantity, v_product.name;
      end if;

      v_unit_price := v_product.price;
      if v_product.sale_price is not null
         and v_product.sale_price > 0
         and v_product.sale_price < v_unit_price then
        v_unit_price := v_product.sale_price;
      end if;
      v_unit_cost := coalesce(v_product.cost_price, 0);
      v_line_name := v_product.name;
      v_line_sku := v_product.sku;
      v_line_image := null;
    end if;

    update public.dg_products
    set stock_quantity = stock_quantity - v_item.quantity
    where id = v_product.id
      and stock_quantity >= v_item.quantity
    returning true into v_reserved;

    if v_reserved is distinct from true then
      raise exception 'Stock changed while placing the order. Please try again.';
    end if;

    v_subtotal := v_subtotal + (v_unit_price * v_item.quantity);
    v_lines := v_lines || jsonb_build_array(jsonb_build_object(
      'product_id', v_product.id,
      'variant_id', v_item.variant_id,
      'name', v_line_name,
      'sku', v_line_sku,
      'quantity', v_item.quantity,
      'unit_price', v_unit_price,
      'unit_cost', v_unit_cost,
      'image_url', v_line_image
    ));
  end loop;

  if coalesce(v_store.free_shipping_threshold, 0) > 0
     and v_subtotal >= v_store.free_shipping_threshold then
    v_shipping_fee := 0;
  else
    v_shipping_fee := coalesce(v_store.flat_shipping_fee, 0);
  end if;
  v_total := v_subtotal + v_shipping_fee;

  select c.id into v_customer_id
  from public.dg_customers c
  where c.user_id = v_store.user_id
    and c.phone = p_phone
    and c.deleted_at is null
  order by c.created_at asc
  limit 1;

  if v_customer_id is null then
    insert into public.dg_customers (
      user_id, first_name, last_name, email, phone, address, city
    ) values (
      v_store.user_id, p_first_name, p_last_name, p_email, p_phone, p_address, p_city
    ) returning id into v_customer_id;
  else
    update public.dg_customers
    set first_name = p_first_name,
        last_name = p_last_name,
        email = p_email,
        address = p_address,
        city = p_city
    where id = v_customer_id;
  end if;

  v_order_number := public.next_order_number();
  insert into public.dg_orders (
    user_id, order_number, customer_id, status, payment_status,
    payment_method, channel, subtotal, discount, tax, shipping_fee,
    total, currency, shipping_address, notes
  ) values (
    v_store.user_id, v_order_number, v_customer_id, 'new', 'unpaid',
    p_payment_method, 'online_store', v_subtotal, 0, 0, v_shipping_fee,
    v_total, v_store.currency, concat_ws(', ', p_address, p_city), p_notes
  ) returning id into v_order_id;

  insert into public.dg_order_items (
    user_id, order_id, product_id, variant_id, name, sku, quantity,
    unit_price, unit_cost, discount, total
  )
  select
    v_store.user_id,
    v_order_id,
    (line->>'product_id')::uuid,
    nullif(line->>'variant_id', '')::uuid,
    line->>'name',
    line->>'sku',
    (line->>'quantity')::integer,
    (line->>'unit_price')::numeric,
    (line->>'unit_cost')::numeric,
    0,
    ((line->>'unit_price')::numeric * (line->>'quantity')::integer)
  from jsonb_array_elements(v_lines) as lines(line);

  insert into public.dg_stock_movements (
    user_id, product_id, variant_id, type, quantity, unit_cost, reference
  )
  select
    v_store.user_id,
    (line->>'product_id')::uuid,
    nullif(line->>'variant_id', '')::uuid,
    'sale',
    -((line->>'quantity')::integer),
    (line->>'unit_cost')::numeric,
    v_order_id::text
  from jsonb_array_elements(v_lines) as lines(line);

  insert into public.dg_order_events (user_id, order_id, type, title, body)
  values (
    v_store.user_id,
    v_order_id,
    'created',
    'Order placed on the online store',
    jsonb_array_length(v_lines)::text || ' item(s) · ' || v_store.currency || ' ' || v_total::text
  );

  return jsonb_build_object(
    'orderNumber', v_order_number,
    'total', v_total,
    'subtotal', v_subtotal,
    'shippingFee', v_shipping_fee,
    'currency', v_store.currency
  );
end;
$$;

revoke execute on function public.dg_create_guest_order(text, text, text, text, text, text, text, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.dg_create_guest_order(text, text, text, text, text, text, text, text, text, jsonb) to service_role;
