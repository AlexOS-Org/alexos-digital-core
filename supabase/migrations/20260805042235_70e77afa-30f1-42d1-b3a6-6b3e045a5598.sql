-- Business registry
create table public.businesses (
  id text primary key,
  display_name text not null,
  created_at timestamptz not null default now()
);
grant select on public.businesses to authenticated;
grant all on public.businesses to service_role;
alter table public.businesses enable row level security;
create policy "businesses_read" on public.businesses for select to authenticated using (true);

insert into public.businesses (id, display_name) values
  ('dailygears', 'DailyGears'),
  ('carbar_motion', 'CarBar Motion'),
  ('nuvora', 'Nuvora');

create table public.meta_business_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  business_id text not null references public.businesses(id),
  meta_business_id text not null,
  meta_business_name text,
  status text not null default 'active',
  connected_at timestamptz not null default now(),
  last_synced_at timestamptz
);

create table public.meta_ad_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  business_id text not null references public.businesses(id),
  meta_ad_account_id text not null unique,
  meta_business_id text,
  name text,
  currency text,
  account_status text,
  is_queryable boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.meta_pages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  business_id text not null references public.businesses(id),
  meta_page_id text not null unique,
  name text,
  leadgen_tos_accepted boolean default false,
  created_at timestamptz not null default now()
);

create table public.meta_instagram_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  business_id text not null references public.businesses(id),
  meta_ig_account_id text not null unique,
  meta_page_id text,
  username text,
  created_at timestamptz not null default now()
);

create table public.meta_pixels (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  business_id text not null references public.businesses(id),
  meta_pixel_id text not null unique,
  meta_business_id text,
  name text,
  is_active boolean,
  last_fired_at timestamptz,
  server_last_fired_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.meta_catalogs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  business_id text not null references public.businesses(id),
  meta_catalog_id text not null unique,
  meta_business_id text,
  name text,
  product_count integer,
  product_set_count integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.meta_campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  business_id text not null references public.businesses(id),
  meta_campaign_id text not null unique,
  meta_ad_account_id text not null,
  name text,
  objective text,
  status text,
  daily_budget numeric,
  lifetime_budget numeric,
  bid_strategy text,
  start_time timestamptz,
  stop_time timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.meta_ad_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  business_id text not null references public.businesses(id),
  meta_ad_set_id text not null unique,
  meta_campaign_id text not null,
  name text,
  optimization_goal text,
  billing_event text,
  targeting jsonb,
  daily_budget numeric,
  status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.meta_ads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  business_id text not null references public.businesses(id),
  meta_ad_id text not null unique,
  meta_ad_set_id text not null,
  meta_creative_id text,
  name text,
  status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.meta_insights_daily (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  business_id text not null references public.businesses(id),
  date date not null,
  entity_level text not null check (entity_level in ('account','campaign','adset','ad')),
  meta_entity_id text not null,
  meta_ad_account_id text not null,
  spend numeric not null default 0,
  impressions integer not null default 0,
  reach integer,
  frequency numeric,
  clicks integer not null default 0,
  ctr numeric,
  cpc numeric,
  cpm numeric,
  conversions integer not null default 0,
  conversion_value numeric,
  cost_per_conversion numeric,
  roas numeric,
  currency text,
  synced_at timestamptz not null default now(),
  unique (entity_level, meta_entity_id, date)
);
create index on public.meta_insights_daily (business_id, date);
create index on public.meta_insights_daily (meta_entity_id, date);

create table public.meta_pixel_event_daily (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  business_id text not null references public.businesses(id),
  meta_pixel_id text not null,
  date date not null,
  event_name text not null,
  event_source text,
  event_count integer not null default 0,
  synced_at timestamptz not null default now(),
  unique (meta_pixel_id, date, event_name, event_source)
);

create table public.meta_sync_runs (
  id uuid primary key default gen_random_uuid(),
  business_id text references public.businesses(id),
  sync_type text not null,
  status text not null default 'running',
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  rows_synced integer,
  error_message text
);
grant all on public.meta_sync_runs to service_role;
alter table public.meta_sync_runs enable row level security;

create table public.meta_leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  business_id text not null references public.businesses(id),
  meta_lead_id text not null unique,
  meta_page_id text,
  form_id text,
  field_data jsonb,
  received_at timestamptz,
  synced_at timestamptz not null default now()
);

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  business_id text not null references public.businesses(id),
  file_name text not null,
  file_hash text not null,
  storage_path text not null,
  optimized_path text,
  thumbnail_path text,
  mime_type text not null,
  width integer,
  height integer,
  size_bytes integer,
  category text,
  source text not null default 'original',
  alt_text text,
  tags text[] default '{}',
  compression_status text not null default 'pending',
  uploaded_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, file_hash)
);
create index on public.media_assets (business_id, category);
create index on public.media_assets using gin (tags);

create table public.media_asset_associations (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.media_assets(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  role text,
  created_at timestamptz not null default now(),
  unique (asset_id, entity_type, entity_id, role)
);
create index on public.media_asset_associations (entity_type, entity_id);

create table public.media_asset_versions (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.media_assets(id) on delete cascade,
  version_number integer not null,
  storage_path text not null,
  changed_by uuid references auth.users(id),
  change_note text,
  created_at timestamptz not null default now()
);

create table public.media_collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  business_id text not null references public.businesses(id),
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

create table public.media_collection_items (
  collection_id uuid not null references public.media_collections(id) on delete cascade,
  asset_id uuid not null references public.media_assets(id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (collection_id, asset_id)
);

-- Grants
do $$
declare t text;
begin
  foreach t in array array[
    'meta_business_connections','meta_ad_accounts','meta_pages','meta_instagram_accounts',
    'meta_pixels','meta_catalogs','meta_campaigns','meta_ad_sets','meta_ads',
    'meta_insights_daily','meta_pixel_event_daily','meta_leads',
    'media_assets','media_asset_associations','media_asset_versions',
    'media_collections','media_collection_items'
  ] loop
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

create policy "own_rows" on public.meta_ad_accounts for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own_rows" on public.meta_campaigns for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own_rows" on public.meta_ad_sets for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own_rows" on public.meta_ads for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own_rows" on public.meta_insights_daily for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own_rows" on public.meta_pixel_event_daily for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own_rows" on public.meta_pixels for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own_rows" on public.meta_catalogs for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own_rows" on public.meta_pages for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own_rows" on public.meta_instagram_accounts for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own_rows" on public.meta_leads for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own_rows" on public.meta_business_connections for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own_rows" on public.media_assets for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own_rows" on public.media_collections for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "via_asset" on public.media_asset_associations for all to authenticated
  using (asset_id in (select id from public.media_assets where user_id = (select auth.uid())))
  with check (asset_id in (select id from public.media_assets where user_id = (select auth.uid())));
create policy "via_asset" on public.media_asset_versions for all to authenticated
  using (asset_id in (select id from public.media_assets where user_id = (select auth.uid())))
  with check (asset_id in (select id from public.media_assets where user_id = (select auth.uid())));
create policy "via_collection" on public.media_collection_items for all to authenticated
  using (collection_id in (select id from public.media_collections where user_id = (select auth.uid())))
  with check (collection_id in (select id from public.media_collections where user_id = (select auth.uid())));

-- updated_at triggers
create trigger meta_ad_accounts_updated before update on public.meta_ad_accounts for each row execute function public.update_updated_at_column();
create trigger meta_pixels_updated before update on public.meta_pixels for each row execute function public.update_updated_at_column();
create trigger meta_catalogs_updated before update on public.meta_catalogs for each row execute function public.update_updated_at_column();
create trigger meta_campaigns_updated before update on public.meta_campaigns for each row execute function public.update_updated_at_column();
create trigger meta_ad_sets_updated before update on public.meta_ad_sets for each row execute function public.update_updated_at_column();
create trigger meta_ads_updated before update on public.meta_ads for each row execute function public.update_updated_at_column();
create trigger media_assets_updated before update on public.media_assets for each row execute function public.update_updated_at_column();