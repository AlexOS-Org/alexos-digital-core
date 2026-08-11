-- DailyGear default catalogue taxonomy.
-- Safe to apply during the Supabase migration phase. This migration does not
-- connect to or alter any external account and is intentionally idempotent.
-- Existing users are seeded below; future storefronts are seeded by trigger.

CREATE OR REPLACE FUNCTION public.dg_seed_default_categories(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  parent_uuid uuid;
BEGIN
  -- Top-level storefront categories.
  INSERT INTO public.dg_categories (user_id, name, slug, description, sort_order)
  SELECT _user_id, v.name, v.slug, v.description, v.sort_order
  FROM (VALUES
    ('Bags', 'bags', 'Backpacks, laptop bags, travel bags, handbags and anti-theft bags.', 10),
    ('Accessories', 'accessories', 'Everyday fashion and practical accessories.', 20),
    ('Laptops', 'laptops', 'Business, student, gaming and refurbished laptops.', 30),
    ('Phones', 'phones', 'Smartphones, feature phones and phone essentials.', 40),
    ('Shoes', 'shoes', 'Footwear for men, women, kids and unisex styles.', 50),
    ('Watches', 'watches', 'Smart and traditional watches for everyday wear.', 60),
    ('Smart Gadgets', 'smart-gadgets', 'Wearables, trackers and smart lifestyle technology.', 70),
    ('Electronics', 'electronics', 'Audio, power, charging, displays and computer electronics.', 80),
    ('Home & Living', 'home-living', 'Practical home, organization, lighting and lifestyle products.', 90),
    ('Kitchen', 'kitchen', 'Cookware, appliances, utensils, storage and kitchen gadgets.', 100),
    ('Office', 'office', 'Stationery, desk accessories, office electronics and organization.', 110)
  ) AS v(name, slug, description, sort_order)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.dg_categories c
    WHERE c.user_id = _user_id AND c.slug = v.slug AND c.deleted_at IS NULL
  );

  -- Helper: add a child category only when its parent exists and the child is missing.
  -- Bags
  SELECT id INTO parent_uuid FROM public.dg_categories WHERE user_id = _user_id AND slug = 'bags' AND deleted_at IS NULL LIMIT 1;
  IF parent_uuid IS NOT NULL THEN
    INSERT INTO public.dg_categories (user_id, name, slug, parent_id, sort_order)
    SELECT _user_id, v.name, v.slug, parent_uuid, v.sort_order FROM (VALUES
      ('Backpacks','bags-backpacks',10),('Laptop Bags','bags-laptop',20),('Travel Bags','bags-travel',30),
      ('Handbags','bags-handbags',40),('Crossbody Bags','bags-crossbody',50),('Anti-theft Bags','bags-anti-theft',60)
    ) v(name,slug,sort_order)
    WHERE NOT EXISTS (SELECT 1 FROM public.dg_categories c WHERE c.user_id=_user_id AND c.slug=v.slug AND c.deleted_at IS NULL);
  END IF;

  -- Accessories
  SELECT id INTO parent_uuid FROM public.dg_categories WHERE user_id = _user_id AND slug = 'accessories' AND deleted_at IS NULL LIMIT 1;
  IF parent_uuid IS NOT NULL THEN
    INSERT INTO public.dg_categories (user_id, name, slug, parent_id, sort_order)
    SELECT _user_id, v.name, v.slug, parent_uuid, v.sort_order FROM (VALUES
      ('Wallets','accessories-wallets',10),('Belts','accessories-belts',20),('Sunglasses','accessories-sunglasses',30),
      ('Caps & Hats','accessories-caps-hats',40),('Phone Accessories','accessories-phone',50),('Fashion Accessories','accessories-fashion',60)
    ) v(name,slug,sort_order)
    WHERE NOT EXISTS (SELECT 1 FROM public.dg_categories c WHERE c.user_id=_user_id AND c.slug=v.slug AND c.deleted_at IS NULL);
  END IF;

  -- Laptops
  SELECT id INTO parent_uuid FROM public.dg_categories WHERE user_id = _user_id AND slug = 'laptops' AND deleted_at IS NULL LIMIT 1;
  IF parent_uuid IS NOT NULL THEN
    INSERT INTO public.dg_categories (user_id, name, slug, parent_id, sort_order)
    SELECT _user_id, v.name, v.slug, parent_uuid, v.sort_order FROM (VALUES
      ('Business Laptops','laptops-business',10),('Student Laptops','laptops-student',20),
      ('Gaming Laptops','laptops-gaming',30),('Refurbished / Pre-owned','laptops-refurbished',40)
    ) v(name,slug,sort_order)
    WHERE NOT EXISTS (SELECT 1 FROM public.dg_categories c WHERE c.user_id=_user_id AND c.slug=v.slug AND c.deleted_at IS NULL);
  END IF;

  -- Phones
  SELECT id INTO parent_uuid FROM public.dg_categories WHERE user_id = _user_id AND slug = 'phones' AND deleted_at IS NULL LIMIT 1;
  IF parent_uuid IS NOT NULL THEN
    INSERT INTO public.dg_categories (user_id, name, slug, parent_id, sort_order)
    SELECT _user_id, v.name, v.slug, parent_uuid, v.sort_order FROM (VALUES
      ('Android Phones','phones-android',10),('iPhones','phones-iphone',20),('Feature Phones','phones-feature',30),('Phone Accessories','phones-accessories',40)
    ) v(name,slug,sort_order)
    WHERE NOT EXISTS (SELECT 1 FROM public.dg_categories c WHERE c.user_id=_user_id AND c.slug=v.slug AND c.deleted_at IS NULL);
  END IF;

  -- Shoes: explicitly separated by audience as requested.
  SELECT id INTO parent_uuid FROM public.dg_categories WHERE user_id = _user_id AND slug = 'shoes' AND deleted_at IS NULL LIMIT 1;
  IF parent_uuid IS NOT NULL THEN
    INSERT INTO public.dg_categories (user_id, name, slug, parent_id, sort_order)
    SELECT _user_id, v.name, v.slug, parent_uuid, v.sort_order FROM (VALUES
      ('Men','shoes-men',10),('Women','shoes-women',20),('Kids','shoes-kids',30),('Unisex','shoes-unisex',40)
    ) v(name,slug,sort_order)
    WHERE NOT EXISTS (SELECT 1 FROM public.dg_categories c WHERE c.user_id=_user_id AND c.slug=v.slug AND c.deleted_at IS NULL);
  END IF;

  -- Watches
  SELECT id INTO parent_uuid FROM public.dg_categories WHERE user_id = _user_id AND slug = 'watches' AND deleted_at IS NULL LIMIT 1;
  IF parent_uuid IS NOT NULL THEN
    INSERT INTO public.dg_categories (user_id, name, slug, parent_id, sort_order)
    SELECT _user_id, v.name, v.slug, parent_uuid, v.sort_order FROM (VALUES
      ('Smart Watches','watches-smart',10),('Men''s Watches','watches-men',20),('Women''s Watches','watches-women',30),('Kids'' Watches','watches-kids',40)
    ) v(name,slug,sort_order)
    WHERE NOT EXISTS (SELECT 1 FROM public.dg_categories c WHERE c.user_id=_user_id AND c.slug=v.slug AND c.deleted_at IS NULL);
  END IF;

  -- Smart Gadgets
  SELECT id INTO parent_uuid FROM public.dg_categories WHERE user_id = _user_id AND slug = 'smart-gadgets' AND deleted_at IS NULL LIMIT 1;
  IF parent_uuid IS NOT NULL THEN
    INSERT INTO public.dg_categories (user_id, name, slug, parent_id, sort_order)
    SELECT _user_id, v.name, v.slug, parent_uuid, v.sort_order FROM (VALUES
      ('Smartwatches','smart-gadgets-watches',10),('Smart Bands','smart-gadgets-bands',20),('Earbuds','smart-gadgets-earbuds',30),
      ('Smart Trackers','smart-gadgets-trackers',40),('Smart Home Gadgets','smart-gadgets-home',50),('Wearable Tech','smart-gadgets-wearables',60)
    ) v(name,slug,sort_order)
    WHERE NOT EXISTS (SELECT 1 FROM public.dg_categories c WHERE c.user_id=_user_id AND c.slug=v.slug AND c.deleted_at IS NULL);
  END IF;

  -- Electronics
  SELECT id INTO parent_uuid FROM public.dg_categories WHERE user_id = _user_id AND slug = 'electronics' AND deleted_at IS NULL LIMIT 1;
  IF parent_uuid IS NOT NULL THEN
    INSERT INTO public.dg_categories (user_id, name, slug, parent_id, sort_order)
    SELECT _user_id, v.name, v.slug, parent_uuid, v.sort_order FROM (VALUES
      ('Earphones & Headphones','electronics-audio',10),('Speakers','electronics-speakers',20),('Power Banks','electronics-power-banks',30),
      ('Chargers & Cables','electronics-chargers',40),('TVs & Displays','electronics-displays',50),('Computer Accessories','electronics-computer',60)
    ) v(name,slug,sort_order)
    WHERE NOT EXISTS (SELECT 1 FROM public.dg_categories c WHERE c.user_id=_user_id AND c.slug=v.slug AND c.deleted_at IS NULL);
  END IF;

  -- Home & Living
  SELECT id INTO parent_uuid FROM public.dg_categories WHERE user_id = _user_id AND slug = 'home-living' AND deleted_at IS NULL LIMIT 1;
  IF parent_uuid IS NOT NULL THEN
    INSERT INTO public.dg_categories (user_id, name, slug, parent_id, sort_order)
    SELECT _user_id, v.name, v.slug, parent_uuid, v.sort_order FROM (VALUES
      ('Home Organization','home-organization',10),('Lighting','home-lighting',20),('Décor','home-decor',30),
      ('Cleaning','home-cleaning',40),('Storage','home-storage',50),('Lifestyle Products','home-lifestyle',60)
    ) v(name,slug,sort_order)
    WHERE NOT EXISTS (SELECT 1 FROM public.dg_categories c WHERE c.user_id=_user_id AND c.slug=v.slug AND c.deleted_at IS NULL);
  END IF;

  -- Kitchen
  SELECT id INTO parent_uuid FROM public.dg_categories WHERE user_id = _user_id AND slug = 'kitchen' AND deleted_at IS NULL LIMIT 1;
  IF parent_uuid IS NOT NULL THEN
    INSERT INTO public.dg_categories (user_id, name, slug, parent_id, sort_order)
    SELECT _user_id, v.name, v.slug, parent_uuid, v.sort_order FROM (VALUES
      ('Cookware','kitchen-cookware',10),('Kitchen Appliances','kitchen-appliances',20),('Storage','kitchen-storage',30),
      ('Utensils','kitchen-utensils',40),('Dining','kitchen-dining',50),('Kitchen Gadgets','kitchen-gadgets',60)
    ) v(name,slug,sort_order)
    WHERE NOT EXISTS (SELECT 1 FROM public.dg_categories c WHERE c.user_id=_user_id AND c.slug=v.slug AND c.deleted_at IS NULL);
  END IF;

  -- Office
  SELECT id INTO parent_uuid FROM public.dg_categories WHERE user_id = _user_id AND slug = 'office' AND deleted_at IS NULL LIMIT 1;
  IF parent_uuid IS NOT NULL THEN
    INSERT INTO public.dg_categories (user_id, name, slug, parent_id, sort_order)
    SELECT _user_id, v.name, v.slug, parent_uuid, v.sort_order FROM (VALUES
      ('Stationery','office-stationery',10),('Office Electronics','office-electronics',20),('Desk Accessories','office-desk',30),
      ('Printers & Supplies','office-printers',40),('Organization','office-organization',50),('Work-from-Home','office-work-from-home',60)
    ) v(name,slug,sort_order)
    WHERE NOT EXISTS (SELECT 1 FROM public.dg_categories c WHERE c.user_id=_user_id AND c.slug=v.slug AND c.deleted_at IS NULL);
  END IF;
END;
$$;

-- Seed users that already exist when this migration is applied.
DO $$
DECLARE
  u record;
BEGIN
  FOR u IN SELECT id FROM auth.users LOOP
    PERFORM public.dg_seed_default_categories(u.id);
  END LOOP;
END;
$$;

-- Automatically seed future DailyGear storefront owners.
CREATE OR REPLACE FUNCTION public.dg_storefront_seed_categories()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  PERFORM public.dg_seed_default_categories(NEW.user_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS dg_storefront_seed_categories ON public.dg_storefronts;
CREATE TRIGGER dg_storefront_seed_categories
  AFTER INSERT ON public.dg_storefronts
  FOR EACH ROW
  EXECUTE FUNCTION public.dg_storefront_seed_categories();
