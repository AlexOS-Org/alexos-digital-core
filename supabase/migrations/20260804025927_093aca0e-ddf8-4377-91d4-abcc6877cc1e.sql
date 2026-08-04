CREATE TABLE public.dg_storefronts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE,
  name text NOT NULL DEFAULT 'DailyGear',
  tagline text,
  hero_headline text,
  hero_subheadline text,
  hero_image_url text,
  logo_url text,
  announcement text,
  support_email text,
  support_phone text,
  whatsapp text,
  currency text NOT NULL DEFAULT 'KES',
  free_shipping_threshold numeric NOT NULL DEFAULT 0,
  flat_shipping_fee numeric NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dg_storefronts TO authenticated;
GRANT SELECT ON public.dg_storefronts TO anon;
GRANT ALL ON public.dg_storefronts TO service_role;

ALTER TABLE public.dg_storefronts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their storefront"
  ON public.dg_storefronts FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Published storefronts are public"
  ON public.dg_storefronts FOR SELECT TO anon, authenticated
  USING (published = true);

CREATE TRIGGER dg_storefronts_updated
  BEFORE UPDATE ON public.dg_storefronts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.dg_is_published_store(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.dg_storefronts
    WHERE user_id = _user_id AND published = true
  )
$$;

REVOKE EXECUTE ON FUNCTION public.dg_is_published_store(uuid) FROM PUBLIC, anon, authenticated;

GRANT SELECT ON public.dg_products TO anon;
GRANT SELECT ON public.dg_product_variants TO anon;
GRANT SELECT ON public.dg_categories TO anon;
GRANT SELECT ON public.dg_brands TO anon;

CREATE POLICY "Public can read active products of published stores"
  ON public.dg_products FOR SELECT TO anon, authenticated
  USING (
    deleted_at IS NULL
    AND status = 'active'
    AND public.dg_is_published_store(user_id)
  );

CREATE POLICY "Public can read variants of published stores"
  ON public.dg_product_variants FOR SELECT TO anon, authenticated
  USING (
    deleted_at IS NULL
    AND public.dg_is_published_store(user_id)
  );

CREATE POLICY "Public can read categories of published stores"
  ON public.dg_categories FOR SELECT TO anon, authenticated
  USING (
    deleted_at IS NULL
    AND public.dg_is_published_store(user_id)
  );

CREATE POLICY "Public can read brands of published stores"
  ON public.dg_brands FOR SELECT TO anon, authenticated
  USING (
    deleted_at IS NULL
    AND public.dg_is_published_store(user_id)
  );