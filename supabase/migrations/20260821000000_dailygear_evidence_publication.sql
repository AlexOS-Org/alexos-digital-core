-- DailyGear evidence, SEO, and publication hardening.
-- Additive only: existing rows are preserved. Products remain hidden from the
-- public storefront until availability, evidence, and minimum stock rules are met.

alter table public.dg_products
  add column if not exists slug text,
  add column if not exists short_description text,
  add column if not exists seo_title text,
  add column if not exists seo_description text,
  add column if not exists seo_keywords text[] not null default '{}',
  add column if not exists image_alt_text text,
  add column if not exists availability_confirmed boolean not null default false;

alter table public.dg_product_variants
  add column if not exists color text,
  add column if not exists availability_confirmed boolean not null default false;

create unique index if not exists dg_products_user_slug_unique
  on public.dg_products (user_id, slug)
  where slug is not null and deleted_at is null;

create table if not exists public.dg_product_evidence (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid references public.dg_products(id) on delete set null,
  source_type text not null check (source_type in (
    'commerce_manager',
    'meta_ad',
    'instagram_post',
    'facebook_post',
    'pixel_event',
    'existing_app',
    'image_asset',
    'competitor_research',
    'auren_recommendation'
  )),
  source_id text,
  source_url text,
  source_label text not null,
  source_date timestamptz,
  title text not null,
  raw_excerpt text,
  observed_price numeric,
  observed_currency text not null default 'KES',
  observed_attributes jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  confidence text not null default 'medium' check (confidence in ('high', 'medium', 'low')),
  reconciliation_status text not null default 'candidate' check (reconciliation_status in ('candidate', 'matched', 'verified', 'rejected')),
  historical boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, source_type, source_id)
);

grant select, insert, update, delete on public.dg_product_evidence to authenticated;
grant all on public.dg_product_evidence to service_role;
alter table public.dg_product_evidence enable row level security;
create policy "own dg_product_evidence" on public.dg_product_evidence
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
create index if not exists dg_product_evidence_user_status_idx
  on public.dg_product_evidence (user_id, reconciliation_status, source_type);
create index if not exists dg_product_evidence_product_idx
  on public.dg_product_evidence (product_id);
create trigger dg_product_evidence_updated
  before update on public.dg_product_evidence
  for each row execute function public.update_updated_at_column();

create or replace function public.dg_enforce_product_publishability()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status = 'active' and (
    coalesce(new.stock_quantity, 0) < 15
    or coalesce(new.availability_confirmed, false) = false
  ) then
    raise exception 'A product must have confirmed availability and at least 15 units before publication.';
  end if;

  if new.status = 'active' and exists (
    select 1
    from public.dg_product_variants v
    where v.product_id = new.id
      and v.deleted_at is null
      and (
        coalesce(v.stock_quantity, 0) < 15
        or coalesce(v.availability_confirmed, false) = false
      )
  ) then
    raise exception 'Every published colour or SKU variant must have confirmed availability and at least 15 units.';
  end if;

  return new;
end;
$$;

drop trigger if exists dg_products_publishability on public.dg_products;
create trigger dg_products_publishability
  before insert or update of status, availability_confirmed
  on public.dg_products
  for each row execute function public.dg_enforce_product_publishability();

create or replace function public.dg_enforce_variant_publishability()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  parent_status public.dg_product_status;
begin
  select status into parent_status
  from public.dg_products
  where id = new.product_id and deleted_at is null;

  if parent_status = 'active' and (
    coalesce(new.stock_quantity, 0) < 15
    or coalesce(new.availability_confirmed, false) = false
  ) then
    raise exception 'Every published colour or SKU variant must have confirmed availability and at least 15 units.';
  end if;
  return new;
end;
$$;

drop trigger if exists dg_product_variants_publishability on public.dg_product_variants;
create trigger dg_product_variants_publishability
  before insert or update of availability_confirmed
  on public.dg_product_variants
  for each row execute function public.dg_enforce_variant_publishability();

-- Public reads enforce the same publication gate. Authenticated owners still
-- retain their existing own-row policy and can manage drafts below the gate.
drop policy if exists "Public can read active products of published stores" on public.dg_products;
create policy "Public can read publishable products of published stores"
  on public.dg_products for select to anon, authenticated
  using (
    deleted_at is null
    and status = 'active'
    and availability_confirmed = true
    and public.dg_is_published_store(user_id)
  );

drop policy if exists "Public can read variants of published stores" on public.dg_product_variants;
create policy "Public can read publishable variants of published stores"
  on public.dg_product_variants for select to anon, authenticated
  using (
    deleted_at is null
    and availability_confirmed = true
    and exists (
      select 1
      from public.dg_products p
      where p.id = product_id
        and p.deleted_at is null
        and p.status = 'active'
        and availability_confirmed = true
        and public.dg_is_published_store(p.user_id)
    )
  );

-- Variant-aware atomic reservation. The parent product and selected variant
-- are checked before either row is changed, so a failed reservation changes no stock.
create or replace function public.dg_reserve_variant_stock(
  p_product_id uuid,
  p_variant_id uuid,
  p_qty integer
)
returns boolean
language plpgsql
set search_path = public
as $$
declare
  v_variant_stock integer;
  v_product_stock integer;
begin
  if p_qty is null or p_qty < 1 then
    return false;
  end if;

  select stock_quantity into v_variant_stock
  from public.dg_product_variants
  where id = p_variant_id
    and product_id = p_product_id
    and deleted_at is null;

  select stock_quantity into v_product_stock
  from public.dg_products
  where id = p_product_id
    and deleted_at is null
    and status = 'active';

  if v_variant_stock is null or v_product_stock is null
     or v_variant_stock < p_qty or v_product_stock < p_qty then
    return false;
  end if;

  update public.dg_product_variants
  set stock_quantity = stock_quantity - p_qty
  where id = p_variant_id;

  update public.dg_products
  set stock_quantity = stock_quantity - p_qty
  where id = p_product_id;

  return true;
end;
$$;

revoke execute on function public.dg_reserve_variant_stock(uuid, uuid, integer) from public, anon, authenticated;
grant execute on function public.dg_reserve_variant_stock(uuid, uuid, integer) to service_role;
