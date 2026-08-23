-- Keep evidence records private while allowing public catalogue policies to
-- check a minimal boolean publication condition without being blocked by RLS.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated;

create or replace function private.dg_has_verified_product_evidence(_product_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.dg_product_evidence e
    where e.product_id = _product_id
      and e.reconciliation_status = 'verified'
  );
$$;

revoke all on function private.dg_has_verified_product_evidence(uuid) from public, anon, authenticated;
grant execute on function private.dg_has_verified_product_evidence(uuid) to anon, authenticated;

-- Public product reads retain all existing publication gates, but the evidence
-- existence test now executes with the helper owner’s controlled privileges.
drop policy if exists "Public can read publishable products of published stores" on public.dg_products;
create policy "Public can read publishable products of published stores"
  on public.dg_products for select to anon, authenticated
  using (
    deleted_at is null
    and status = 'active'
    and availability_confirmed = true
    and category_id is not null
    and public.dg_is_published_store(user_id)
    and private.dg_has_verified_product_evidence(id)
  );

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
        and private.dg_has_verified_product_evidence(p.id)
    )
  );
