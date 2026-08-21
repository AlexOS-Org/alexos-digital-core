-- Atomic guest-order RPC publication gate.
-- Reuses the existing Kenya checkout transaction and rejects active products
-- without a canonical category or verified first-party evidence.

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
  p_items jsonb,
  p_country text,
  p_county text,
  p_town text,
  p_delivery_details text,
  p_funnel_id uuid default null,
  p_attribution jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_store record;
  v_funnel record;
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
  v_reserved boolean;
  v_offer_role text;
  v_attribution jsonb := coalesce(p_attribution, '{}'::jsonb);
begin
  if lower(trim(coalesce(p_country, ''))) <> 'kenya' then
    raise exception 'DailyGear currently delivers within Kenya only.';
  end if;

  if nullif(trim(coalesce(p_county, '')), '') is null then
    raise exception 'A delivery county is required.';
  end if;

  if nullif(trim(coalesce(p_town, '')), '') is null then
    raise exception 'A delivery town is required.';
  end if;

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

  if p_funnel_id is not null then
    select * into v_funnel
    from public.dg_funnels
    where id = p_funnel_id
      and user_id = v_store.user_id
      and storefront_id = v_store.id
      and status = 'published'
    limit 1;

    if not found then
      raise exception 'This sales experience is no longer available.';
    end if;
  end if;

  for v_item in
    select *
    from jsonb_to_recordset(p_items) as item(
      product_id uuid,
      variant_id uuid,
      quantity integer,
      offer_role text,
      funnel_step_id uuid
    )
  loop
    if v_item.product_id is null or v_item.quantity is null or v_item.quantity < 1 then
      raise exception 'An item in your cart is invalid.';
    end if;

    v_offer_role := coalesce(nullif(v_item.offer_role, ''), 'primary');
    if v_offer_role not in ('primary', 'order_bump', 'upsell', 'downsell') then
      raise exception 'An item offer type is invalid.';
    end if;

    if v_offer_role <> 'primary' then
      if p_funnel_id is null or v_item.funnel_step_id is null then
        raise exception 'An offer is missing its funnel context.';
      end if;
      if not exists (
        select 1
        from public.dg_funnel_steps s
        where s.id = v_item.funnel_step_id
          and s.funnel_id = p_funnel_id
          and s.user_id = v_store.user_id
          and s.enabled = true
          and s.step_type = v_offer_role
          and s.product_id = v_item.product_id
      ) then
        raise exception 'A selected offer is no longer configured.';
      end if;
    end if;

    select p.* into v_product
    from public.dg_products p
    where p.id = v_item.product_id
      and p.user_id = v_store.user_id
      and p.deleted_at is null
      and p.status = 'active'
      and p.availability_confirmed = true
      and p.category_id is not null
      and exists (
        select 1
        from public.dg_product_evidence e
        where e.product_id = p.id
          and e.user_id = v_store.user_id
          and e.reconciliation_status = 'verified'
      )
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
      'name', case when v_item.variant_id is null then v_product.name else v_product.name || ' — ' || v_variant.name end,
      'sku', case when v_item.variant_id is null then v_product.sku else coalesce(v_variant.sku, v_product.sku) end,
      'quantity', v_item.quantity,
      'unit_price', v_unit_price,
      'unit_cost', v_unit_cost,
      'image_url', case when v_item.variant_id is null then null else v_variant.image_url end,
      'offer_role', v_offer_role,
      'funnel_step_id', v_item.funnel_step_id
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
      user_id, first_name, last_name, email, phone, address, city, country, county, town, delivery_details
    ) values (
      v_store.user_id, p_first_name, p_last_name, p_email, p_phone, p_address, p_town,
      'Kenya', trim(p_county), trim(p_town), nullif(trim(coalesce(p_delivery_details, '')), '')
    ) returning id into v_customer_id;
  else
    update public.dg_customers
    set first_name = p_first_name,
        last_name = p_last_name,
        email = p_email,
        phone = p_phone,
        address = p_address,
        city = p_town,
        country = 'Kenya',
        county = trim(p_county),
        town = trim(p_town),
        delivery_details = nullif(trim(coalesce(p_delivery_details, '')), '')
    where id = v_customer_id;
  end if;

  v_order_number := public.next_order_number();
  insert into public.dg_orders (
    user_id, order_number, customer_id, status, payment_status,
    payment_method, channel, funnel_id, subtotal, discount, tax, shipping_fee,
    total, currency, shipping_address, shipping_country, shipping_county,
    shipping_town, shipping_address_details, shipping_zone, notes
  ) values (
    v_store.user_id, v_order_number, v_customer_id, 'new', 'unpaid',
    p_payment_method,
    case when p_funnel_id is null then 'online_store' else 'funnel' end,
    p_funnel_id,
    v_subtotal, 0, 0, v_shipping_fee,
    v_total, v_store.currency,
    concat_ws(', ', nullif(trim(coalesce(p_delivery_details, '')), ''), p_address, trim(p_town), trim(p_county), 'Kenya'),
    'Kenya', trim(p_county), trim(p_town), nullif(trim(coalesce(p_delivery_details, '')), ''), null, p_notes
  ) returning id into v_order_id;

  insert into public.dg_order_items (
    user_id, order_id, product_id, variant_id, name, sku, quantity,
    unit_price, unit_cost, discount, total, offer_role, funnel_step_id
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
    ((line->>'unit_price')::numeric * (line->>'quantity')::integer),
    coalesce(nullif(line->>'offer_role', ''), 'primary'),
    nullif(line->>'funnel_step_id', '')::uuid
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
    case when p_funnel_id is null then 'Order placed on the online store' else 'Order placed through a DailyGear funnel' end,
    jsonb_array_length(v_lines)::text || ' item(s) · ' || v_store.currency || ' ' || v_total::text
  );

  if p_funnel_id is not null then
    insert into public.dg_order_attribution (
      user_id, order_id, funnel_id, landing_page, destination_url,
      source, medium, campaign, campaign_id, ad_set, ad_set_id,
      ad, ad_id, creative, creative_id
    ) values (
      v_store.user_id,
      v_order_id,
      p_funnel_id,
      nullif(v_attribution->>'landingPage', ''),
      nullif(v_attribution->>'destinationUrl', ''),
      nullif(v_attribution->>'source', ''),
      nullif(v_attribution->>'medium', ''),
      nullif(v_attribution->>'campaign', ''),
      nullif(v_attribution->>'campaignId', ''),
      nullif(v_attribution->>'adSet', ''),
      nullif(v_attribution->>'adSetId', ''),
      nullif(v_attribution->>'ad', ''),
      nullif(v_attribution->>'adId', ''),
      nullif(v_attribution->>'creative', ''),
      nullif(v_attribution->>'creativeId', '')
    );
  end if;

  return jsonb_build_object(
    'orderNumber', v_order_number,
    'total', v_total,
    'subtotal', v_subtotal,
    'shippingFee', v_shipping_fee,
    'currency', v_store.currency,
    'funnelId', p_funnel_id
  );
end;
$$;

revoke execute on function public.dg_create_guest_order(text,text,text,text,text,text,text,text,text,jsonb,text,text,text,text,uuid,jsonb) from public, anon, authenticated;
grant execute on function public.dg_create_guest_order(text,text,text,text,text,text,text,text,text,jsonb,text,text,text,text,uuid,jsonb) to service_role;
