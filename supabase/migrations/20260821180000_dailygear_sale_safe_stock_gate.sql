-- Sale-safe publication gate.
--
-- The 15-unit rule applies when a product or variant is created, published or
-- marked available. It must not run on an ordinary stock decrement created by
-- a sale; completed sales are allowed to take stock below 15. Replenishment
-- and new publication still pass through the active-product/variant gates.

drop trigger if exists dg_product_variants_publishability on public.dg_product_variants;

create trigger dg_product_variants_publishability
before insert or update of availability_confirmed, product_id
on public.dg_product_variants
for each row execute function public.dg_enforce_variant_publishability();
