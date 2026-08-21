-- DailyGear master taxonomy and Kenya-first checkout location fields.
-- Additive and idempotent: reuses dg_categories and the existing guest-order RPC.

alter table public.dg_customers
  add column if not exists county text,
  add column if not exists town text,
  add column if not exists delivery_details text;

alter table public.dg_orders
  add column if not exists shipping_country text,
  add column if not exists shipping_county text,
  add column if not exists shipping_town text,
  add column if not exists shipping_address_details text,
  add column if not exists shipping_zone text;

create unique index if not exists dg_categories_user_slug_unique
  on public.dg_categories (user_id, slug)
  where deleted_at is null and slug is not null;

create or replace function public.dg_seed_default_categories(_user_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  insert into public.dg_categories (user_id, name, slug, description, sort_order)
  select _user_id, v.name, v.slug, v.description, v.sort_order
  from (values
    ('Phones & Tablets', 'phones-tablets', 'Phones & Tablets products and related essentials.', 10),
    ('Laptops & Computers', 'laptops-computers', 'Laptops & Computers products and related essentials.', 20),
    ('Electronics', 'electronics', 'Electronics products and related essentials.', 30),
    ('TV, Audio & Entertainment', 'tv-audio-entertainment', 'TV, Audio & Entertainment products and related essentials.', 40),
    ('Power & Energy', 'power-energy', 'Power & Energy products and related essentials.', 50),
    ('Car Accessories', 'car-accessories', 'Car Accessories products and related essentials.', 60),
    ('Bags & Luggage', 'bags-luggage', 'Bags & Luggage products and related essentials.', 70),
    ('Fashion & Clothing', 'fashion-clothing', 'Fashion & Clothing products and related essentials.', 80),
    ('Beauty & Personal Care', 'beauty-personal-care', 'Beauty & Personal Care products and related essentials.', 90),
    ('Home & Living', 'home-living', 'Home & Living products and related essentials.', 100),
    ('Kitchen & Dining', 'kitchen-dining', 'Kitchen & Dining products and related essentials.', 110),
    ('Health & Fitness', 'health-fitness', 'Health & Fitness products and related essentials.', 120),
    ('Baby, Kids & Toys', 'baby-kids-toys', 'Baby, Kids & Toys products and related essentials.', 130),
    ('Office & Stationery', 'office-stationery', 'Office & Stationery products and related essentials.', 140),
    ('Travel & Outdoor', 'travel-outdoor', 'Travel & Outdoor products and related essentials.', 150),
    ('Smart Home & Security', 'smart-home-security', 'Smart Home & Security products and related essentials.', 160),
    ('Tools & DIY', 'tools-diy', 'Tools & DIY products and related essentials.', 170),
    ('Pet Supplies', 'pet-supplies', 'Pet Supplies products and related essentials.', 180),
    ('Gadgets & Accessories', 'gadgets-accessories', 'Gadgets & Accessories products and related essentials.', 190),
    ('Deals & Featured', 'deals-featured', 'Deals & Featured products and related essentials.', 200)
  ) as v(name, slug, description, sort_order)
  where not exists (
    select 1 from public.dg_categories c
    where c.user_id = _user_id and c.slug = v.slug and c.deleted_at is null
  );

  insert into public.dg_categories (user_id, name, slug, parent_id, sort_order)
  select _user_id, v.name, v.slug, p.id, v.sort_order
  from (values
    ('phones-tablets', 'Smartphones', 'phones-tablets-smartphones', 10),
    ('phones-tablets', 'Feature Phones', 'phones-tablets-feature-phones', 20),
    ('phones-tablets', 'Tablets', 'phones-tablets-tablets', 30),
    ('phones-tablets', 'Phone Accessories', 'phones-tablets-phone-accessories', 40),
    ('phones-tablets', 'Chargers & Cables', 'phones-tablets-chargers-and-cables', 50),
    ('phones-tablets', 'Power Banks', 'phones-tablets-power-banks', 60),
    ('phones-tablets', 'Phone Cases & Covers', 'phones-tablets-phone-cases-and-covers', 70),
    ('phones-tablets', 'Screen Protectors', 'phones-tablets-screen-protectors', 80),
    ('laptops-computers', 'Laptops', 'laptops-computers-laptops', 10),
    ('laptops-computers', 'Desktop Computers', 'laptops-computers-desktop-computers', 20),
    ('laptops-computers', 'Monitors', 'laptops-computers-monitors', 30),
    ('laptops-computers', 'Keyboards & Mice', 'laptops-computers-keyboards-and-mice', 40),
    ('laptops-computers', 'Computer Accessories', 'laptops-computers-computer-accessories', 50),
    ('laptops-computers', 'Storage Devices', 'laptops-computers-storage-devices', 60),
    ('laptops-computers', 'USB Hubs & Adapters', 'laptops-computers-usb-hubs-and-adapters', 70),
    ('electronics', 'Audio & Headphones', 'electronics-audio-and-headphones', 10),
    ('electronics', 'Speakers', 'electronics-speakers', 20),
    ('electronics', 'Cameras & Accessories', 'electronics-cameras-and-accessories', 30),
    ('electronics', 'Smart Devices', 'electronics-smart-devices', 40),
    ('electronics', 'Electronic Accessories', 'electronics-electronic-accessories', 50),
    ('electronics', 'Cables & Adapters', 'electronics-cables-and-adapters', 60),
    ('tv-audio-entertainment', 'TVs', 'tv-audio-entertainment-tvs', 10),
    ('tv-audio-entertainment', 'TV Accessories', 'tv-audio-entertainment-tv-accessories', 20),
    ('tv-audio-entertainment', 'Soundbars', 'tv-audio-entertainment-soundbars', 30),
    ('tv-audio-entertainment', 'Home Audio', 'tv-audio-entertainment-home-audio', 40),
    ('tv-audio-entertainment', 'Streaming Devices', 'tv-audio-entertainment-streaming-devices', 50),
    ('tv-audio-entertainment', 'Gaming Accessories', 'tv-audio-entertainment-gaming-accessories', 60),
    ('power-energy', 'Power Banks', 'power-energy-power-banks', 10),
    ('power-energy', 'Car Inverters', 'power-energy-car-inverters', 20),
    ('power-energy', 'Solar Products', 'power-energy-solar-products', 30),
    ('power-energy', 'Portable Power Stations', 'power-energy-portable-power-stations', 40),
    ('power-energy', 'Chargers', 'power-energy-chargers', 50),
    ('power-energy', 'Extension Cables', 'power-energy-extension-cables', 60),
    ('power-energy', 'Power Accessories', 'power-energy-power-accessories', 70),
    ('car-accessories', 'Car Electronics', 'car-accessories-car-electronics', 10),
    ('car-accessories', 'Car Chargers', 'car-accessories-car-chargers', 20),
    ('car-accessories', 'Inverters', 'car-accessories-inverters', 30),
    ('car-accessories', 'Phone Holders', 'car-accessories-phone-holders', 40),
    ('car-accessories', 'Interior Accessories', 'car-accessories-interior-accessories', 50),
    ('car-accessories', 'Exterior Accessories', 'car-accessories-exterior-accessories', 60),
    ('car-accessories', 'Car Care', 'car-accessories-car-care', 70),
    ('car-accessories', 'Safety Accessories', 'car-accessories-safety-accessories', 80),
    ('bags-luggage', 'Backpacks', 'bags-luggage-backpacks', 10),
    ('bags-luggage', 'Laptop Bags', 'bags-luggage-laptop-bags', 20),
    ('bags-luggage', 'Handbags', 'bags-luggage-handbags', 30),
    ('bags-luggage', 'Travel Bags', 'bags-luggage-travel-bags', 40),
    ('bags-luggage', 'Duffel Bags', 'bags-luggage-duffel-bags', 50),
    ('bags-luggage', 'Suitcases', 'bags-luggage-suitcases', 60),
    ('bags-luggage', 'Wallets', 'bags-luggage-wallets', 70),
    ('bags-luggage', 'Travel Accessories', 'bags-luggage-travel-accessories', 80),
    ('fashion-clothing', 'Men''s Clothing', 'fashion-clothing-men-s-clothing', 10),
    ('fashion-clothing', 'Women''s Clothing', 'fashion-clothing-women-s-clothing', 20),
    ('fashion-clothing', 'Shoes', 'fashion-clothing-shoes', 30),
    ('fashion-clothing', 'Sandals', 'fashion-clothing-sandals', 40),
    ('fashion-clothing', 'Watches', 'fashion-clothing-watches', 50),
    ('fashion-clothing', 'Fashion Accessories', 'fashion-clothing-fashion-accessories', 60),
    ('fashion-clothing', 'Belts', 'fashion-clothing-belts', 70),
    ('fashion-clothing', 'Sunglasses', 'fashion-clothing-sunglasses', 80),
    ('beauty-personal-care', 'Hair Care', 'beauty-personal-care-hair-care', 10),
    ('beauty-personal-care', 'Skincare', 'beauty-personal-care-skincare', 20),
    ('beauty-personal-care', 'Grooming', 'beauty-personal-care-grooming', 30),
    ('beauty-personal-care', 'Personal Care Devices', 'beauty-personal-care-personal-care-devices', 40),
    ('beauty-personal-care', 'Beauty Accessories', 'beauty-personal-care-beauty-accessories', 50),
    ('home-living', 'Kitchen', 'home-living-kitchen', 10),
    ('home-living', 'Home Organization', 'home-living-home-organization', 20),
    ('home-living', 'Home Accessories', 'home-living-home-accessories', 30),
    ('home-living', 'Cleaning', 'home-living-cleaning', 40),
    ('home-living', 'Lighting', 'home-living-lighting', 50),
    ('home-living', 'Household Essentials', 'home-living-household-essentials', 60),
    ('kitchen-dining', 'Kitchen Appliances', 'kitchen-dining-kitchen-appliances', 10),
    ('kitchen-dining', 'Cookware', 'kitchen-dining-cookware', 20),
    ('kitchen-dining', 'Utensils', 'kitchen-dining-utensils', 30),
    ('kitchen-dining', 'Storage', 'kitchen-dining-storage', 40),
    ('kitchen-dining', 'Drinkware', 'kitchen-dining-drinkware', 50),
    ('kitchen-dining', 'Dining Accessories', 'kitchen-dining-dining-accessories', 60),
    ('health-fitness', 'Fitness Equipment', 'health-fitness-fitness-equipment', 10),
    ('health-fitness', 'Exercise Accessories', 'health-fitness-exercise-accessories', 20),
    ('health-fitness', 'Personal Wellness', 'health-fitness-personal-wellness', 30),
    ('health-fitness', 'Sports Accessories', 'health-fitness-sports-accessories', 40),
    ('baby-kids-toys', 'Baby Products', 'baby-kids-toys-baby-products', 10),
    ('baby-kids-toys', 'Kids'' Accessories', 'baby-kids-toys-kids-accessories', 20),
    ('baby-kids-toys', 'Toys', 'baby-kids-toys-toys', 30),
    ('baby-kids-toys', 'Educational Toys', 'baby-kids-toys-educational-toys', 40),
    ('baby-kids-toys', 'Kids'' Electronics', 'baby-kids-toys-kids-electronics', 50),
    ('office-stationery', 'Office Equipment', 'office-stationery-office-equipment', 10),
    ('office-stationery', 'Stationery', 'office-stationery-stationery', 20),
    ('office-stationery', 'Writing Supplies', 'office-stationery-writing-supplies', 30),
    ('office-stationery', 'Desk Accessories', 'office-stationery-desk-accessories', 40),
    ('office-stationery', 'School Supplies', 'office-stationery-school-supplies', 50),
    ('travel-outdoor', 'Travel Accessories', 'travel-outdoor-travel-accessories', 10),
    ('travel-outdoor', 'Camping', 'travel-outdoor-camping', 20),
    ('travel-outdoor', 'Outdoor Equipment', 'travel-outdoor-outdoor-equipment', 30),
    ('travel-outdoor', 'Hiking Accessories', 'travel-outdoor-hiking-accessories', 40),
    ('travel-outdoor', 'Outdoor Gadgets', 'travel-outdoor-outdoor-gadgets', 50),
    ('smart-home-security', 'Smart Home Devices', 'smart-home-security-smart-home-devices', 10),
    ('smart-home-security', 'Security Cameras', 'smart-home-security-security-cameras', 20),
    ('smart-home-security', 'Door & Safety Devices', 'smart-home-security-door-and-safety-devices', 30),
    ('smart-home-security', 'Smart Lighting', 'smart-home-security-smart-lighting', 40),
    ('smart-home-security', 'Smart Accessories', 'smart-home-security-smart-accessories', 50),
    ('tools-diy', 'Hand Tools', 'tools-diy-hand-tools', 10),
    ('tools-diy', 'Power Tools', 'tools-diy-power-tools', 20),
    ('tools-diy', 'Hardware', 'tools-diy-hardware', 30),
    ('tools-diy', 'DIY Accessories', 'tools-diy-diy-accessories', 40),
    ('tools-diy', 'Measuring Tools', 'tools-diy-measuring-tools', 50),
    ('pet-supplies', 'Pet Accessories', 'pet-supplies-pet-accessories', 10),
    ('pet-supplies', 'Pet Feeding', 'pet-supplies-pet-feeding', 20),
    ('pet-supplies', 'Pet Grooming', 'pet-supplies-pet-grooming', 30),
    ('pet-supplies', 'Pet Toys', 'pet-supplies-pet-toys', 40),
    ('gadgets-accessories', 'Tech Gadgets', 'gadgets-accessories-tech-gadgets', 10),
    ('gadgets-accessories', 'Useful Gadgets', 'gadgets-accessories-useful-gadgets', 20),
    ('gadgets-accessories', 'Portable Gadgets', 'gadgets-accessories-portable-gadgets', 30),
    ('gadgets-accessories', 'Accessories', 'gadgets-accessories-accessories', 40)
  ) as v(parent_slug, name, slug, sort_order)
  join public.dg_categories p
    on p.user_id = _user_id and p.slug = v.parent_slug and p.parent_id is null and p.deleted_at is null
  where not exists (
    select 1 from public.dg_categories c
    where c.user_id = _user_id and c.slug = v.slug and c.deleted_at is null
  );
end;
$$;

do $$
declare u record;
begin
  for u in select id from auth.users loop
    perform public.dg_seed_default_categories(u.id);
  end loop;
end;
$$;

create or replace function public.dg_storefront_seed_categories()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  perform public.dg_seed_default_categories(new.user_id);
  return new;
end;
$$;

drop trigger if exists dg_storefront_seed_categories on public.dg_storefronts;
create trigger dg_storefront_seed_categories
  after insert on public.dg_storefronts
  for each row execute function public.dg_storefront_seed_categories();

-- The guest-order RPC remains the only public checkout order path. Its
-- additional location parameters are defined in a separate migration file.
