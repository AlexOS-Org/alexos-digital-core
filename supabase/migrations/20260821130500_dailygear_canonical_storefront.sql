-- Publish the existing canonical DailyGear catalogue through its live Worker domain.
-- This creates no products, customers or orders and leaves support details editable
-- in DailyGear Settings.

insert into public.dg_storefronts (
  user_id,
  slug,
  name,
  tagline,
  currency,
  free_shipping_threshold,
  flat_shipping_fee,
  published
)
values (
  'c8b05141-4253-4bb0-9ca7-8ea32658a02e'::uuid,
  'dailygear',
  'DailyGear',
  'Smart, convenient gear for the way your day moves.',
  'KES',
  0,
  0,
  true
)
on conflict (user_id) do update
set slug = excluded.slug,
    name = excluded.name,
    tagline = coalesce(public.dg_storefronts.tagline, excluded.tagline),
    currency = 'KES',
    free_shipping_threshold = coalesce(public.dg_storefronts.free_shipping_threshold, 0),
    flat_shipping_fee = coalesce(public.dg_storefronts.flat_shipping_fee, 0),
    published = true;
