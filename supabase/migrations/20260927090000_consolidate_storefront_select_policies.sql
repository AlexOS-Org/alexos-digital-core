-- Consolidate duplicate authenticated SELECT policies on public catalogue tables.
-- Anonymous publication access is unchanged; authenticated owners retain access
-- through the existing owner policies, while the public policies become anon-only.

DROP POLICY IF EXISTS "Public can read publishable products of published stores"
  ON public.dg_products;
CREATE POLICY "Public can read publishable products of published stores"
  ON public.dg_products
  FOR SELECT
  TO anon
  USING (
    deleted_at IS NULL
    AND status = 'active'
    AND availability_confirmed = true
    AND category_id IS NOT NULL
    AND dg_is_published_store(user_id)
    AND private.dg_has_verified_product_evidence(id)
  );

DROP POLICY IF EXISTS "Public can read publishable variants of published stores"
  ON public.dg_product_variants;
CREATE POLICY "Public can read publishable variants of published stores"
  ON public.dg_product_variants
  FOR SELECT
  TO anon
  USING (
    deleted_at IS NULL
    AND availability_confirmed = true
    AND EXISTS (
      SELECT 1
      FROM public.dg_products AS p
      WHERE p.id = dg_product_variants.product_id
        AND p.deleted_at IS NULL
        AND p.status = 'active'
        AND p.availability_confirmed = true
        AND p.category_id IS NOT NULL
        AND dg_is_published_store(p.user_id)
        AND private.dg_has_verified_product_evidence(p.id)
    )
  );
