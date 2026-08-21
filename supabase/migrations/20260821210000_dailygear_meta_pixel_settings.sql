alter table public.dg_storefronts
  add column if not exists meta_pixel_id text;

comment on column public.dg_storefronts.meta_pixel_id is
  'Owner-provided Meta Pixel identifier for browser standard events; never store an access token here.';
