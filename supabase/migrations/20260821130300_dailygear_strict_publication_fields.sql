-- Complete the evidence-first publication gate for active DailyGear products.
-- This is additive and preserves the current product/order architecture.

create or replace function public.dg_enforce_product_publishability()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status = 'active' and new.category_id is null then
    raise exception 'An active product must have a primary DailyGear category.';
  end if;

  if new.status = 'active' and not exists (
    select 1
    from public.dg_product_evidence e
    where e.product_id = new.id
      and e.reconciliation_status = 'verified'
  ) then
    raise exception 'An active product must have verified source evidence.';
  end if;

  if new.status = 'active' and nullif(trim(new.slug), '') is null then
    raise exception 'An active product must have a stable public slug.';
  end if;

  if new.status = 'active' and nullif(trim(new.seo_title), '') is null then
    raise exception 'An active product must have an SEO title.';
  end if;

  if new.status = 'active' and nullif(trim(new.seo_description), '') is null then
    raise exception 'An active product must have an SEO description.';
  end if;

  if new.status = 'active' and nullif(trim(new.image_alt_text), '') is null then
    raise exception 'An active product must have image alt text.';
  end if;

  if new.status = 'active' and cardinality(coalesce(new.images, '{}'::text[])) = 0 then
    raise exception 'An active product must have at least one verified product image.';
  end if;

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
  before insert or update of status, availability_confirmed, category_id
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
  before insert or update of availability_confirmed, stock_quantity, product_id
  on public.dg_product_variants
  for each row execute function public.dg_enforce_variant_publishability();
