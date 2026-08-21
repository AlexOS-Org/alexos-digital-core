-- Assign existing products only when their identity is supported by a matched
-- or verified first-party catalogue/social evidence record. Products with an
-- existing category are left untouched, and no product rows are created.

with product_category_map(product_name, parent_slug, child_slug) as (
  values
    ('3 Column Plastic Wardrobe', 'home-living', 'home-living-home-organization'),
    ('Berluti Footwear', 'fashion-clothing', 'fashion-clothing-shoes'),
    ('Boys Leather School Shoes', 'fashion-clothing', 'fashion-clothing-shoes'),
    ('Children School Backpack – Blue 46 × 32 × 16 cm', 'bags-luggage', 'bags-luggage-backpacks'),
    ('Children School Bag – Pink 45 × 30 × 16 cm', 'bags-luggage', 'bags-luggage-backpacks'),
    ('Girls Leather School Shoes', 'fashion-clothing', 'fashion-clothing-shoes'),
    ('Ladies Sandals', 'fashion-clothing', 'fashion-clothing-sandals'),
    ('NAVIFORCE Ladies Watch #NF5060', 'fashion-clothing', 'fashion-clothing-watches'),
    ('OCHSTIN Chronograph Gents Watch #6063', 'fashion-clothing', 'fashion-clothing-watches'),
    ('Tote Bag – Four Colour Collection', 'bags-luggage', 'bags-luggage-handbags')
), resolved as (
  select p.id, child.id as category_id
  from public.dg_products p
  join product_category_map m
    on lower(trim(p.name)) = lower(trim(m.product_name))
  join public.dg_categories parent
    on parent.user_id = p.user_id
   and parent.slug = m.parent_slug
   and parent.parent_id is null
   and parent.deleted_at is null
  join public.dg_categories child
    on child.user_id = p.user_id
   and child.slug = m.child_slug
   and child.parent_id = parent.id
   and child.deleted_at is null
  where p.category_id is null
    and p.deleted_at is null
    and exists (
      select 1
      from public.dg_product_evidence e
      where e.product_id = p.id
        and e.user_id = p.user_id
        and e.source_type in ('commerce_manager', 'instagram_post', 'facebook_post', 'existing_app')
        and e.reconciliation_status in ('matched', 'verified')
    )
)
update public.dg_products p
set category_id = resolved.category_id
from resolved
where p.id = resolved.id
  and p.category_id is null;
