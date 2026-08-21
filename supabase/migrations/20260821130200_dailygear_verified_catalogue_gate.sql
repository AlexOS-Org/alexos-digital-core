-- Evidence-first publication gate for the canonical DailyGear catalogue.
-- Existing rows are preserved; products that do not meet the gate remain private.

create index if not exists dg_product_evidence_verified_product_idx
  on public.dg_product_evidence (product_id)
  where reconciliation_status = 'verified';

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

-- Public catalogue reads require a published storefront, an active and available
-- product, a category assignment and verified evidence.
drop policy if exists "Public can read publishable products of published stores" on public.dg_products;
create policy "Public can read publishable products of published stores"
  on public.dg_products for select to anon, authenticated
  using (
    deleted_at is null
    and status = 'active'
    and availability_confirmed = true
    and category_id is not null
    and public.dg_is_published_store(user_id)
    and exists (
      select 1
      from public.dg_product_evidence e
      where e.product_id = dg_products.id
        and e.reconciliation_status = 'verified'
    )
  );

-- Variants are public only when their parent product passes the same catalogue gate.
drop policy if exists "Public can read publishable variants of published stores" on public.dg_product_variants;
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
        and p.availability_confirmed = true
        and p.category_id is not null
        and public.dg_is_published_store(p.user_id)
        and exists (
          select 1
          from public.dg_product_evidence e
          where e.product_id = p.id
            and e.reconciliation_status = 'verified'
        )
    )
  );
