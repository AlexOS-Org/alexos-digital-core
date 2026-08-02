-- ENUMS
CREATE TYPE public.dg_product_status AS ENUM ('draft','active','archived','out_of_stock');
CREATE TYPE public.dg_order_status AS ENUM ('new','processing','packed','shipped','delivered','cancelled','returned');
CREATE TYPE public.dg_payment_status AS ENUM ('unpaid','partial','paid','refunded');
CREATE TYPE public.dg_stock_movement_type AS ENUM ('purchase','sale','adjustment','transfer_in','transfer_out','return','damage');

-- CATEGORIES
CREATE TABLE public.dg_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text,
  parent_id uuid REFERENCES public.dg_categories(id) ON DELETE SET NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dg_categories TO authenticated;
GRANT ALL ON public.dg_categories TO service_role;
ALTER TABLE public.dg_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own dg_categories" ON public.dg_categories FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- BRANDS
CREATE TABLE public.dg_brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  logo_url text,
  website text,
  notes text,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dg_brands TO authenticated;
GRANT ALL ON public.dg_brands TO service_role;
ALTER TABLE public.dg_brands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own dg_brands" ON public.dg_brands FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- SUPPLIERS
CREATE TABLE public.dg_suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  contact_name text,
  email text,
  phone text,
  address text,
  lead_time_days integer NOT NULL DEFAULT 0,
  notes text,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dg_suppliers TO authenticated;
GRANT ALL ON public.dg_suppliers TO service_role;
ALTER TABLE public.dg_suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own dg_suppliers" ON public.dg_suppliers FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- WAREHOUSES
CREATE TABLE public.dg_warehouses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  location text,
  is_default boolean NOT NULL DEFAULT false,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dg_warehouses TO authenticated;
GRANT ALL ON public.dg_warehouses TO service_role;
ALTER TABLE public.dg_warehouses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own dg_warehouses" ON public.dg_warehouses FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- PRODUCTS
CREATE TABLE public.dg_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  category_id uuid REFERENCES public.dg_categories(id) ON DELETE SET NULL,
  brand_id uuid REFERENCES public.dg_brands(id) ON DELETE SET NULL,
  supplier_id uuid REFERENCES public.dg_suppliers(id) ON DELETE SET NULL,
  sku text,
  barcode text,
  cost_price numeric NOT NULL DEFAULT 0,
  price numeric NOT NULL DEFAULT 0,
  sale_price numeric,
  currency text NOT NULL DEFAULT 'KES',
  stock_quantity integer NOT NULL DEFAULT 0,
  low_stock_threshold integer NOT NULL DEFAULT 5,
  status dg_product_status NOT NULL DEFAULT 'draft',
  images text[] NOT NULL DEFAULT '{}',
  tags text[] NOT NULL DEFAULT '{}',
  attributes jsonb NOT NULL DEFAULT '{}'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dg_products TO authenticated;
GRANT ALL ON public.dg_products TO service_role;
ALTER TABLE public.dg_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own dg_products" ON public.dg_products FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX dg_products_user_status_idx ON public.dg_products (user_id, status);

-- PRODUCT VARIANTS
CREATE TABLE public.dg_product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.dg_products(id) ON DELETE CASCADE,
  name text NOT NULL,
  sku text,
  barcode text,
  price numeric,
  sale_price numeric,
  cost_price numeric,
  stock_quantity integer NOT NULL DEFAULT 0,
  options jsonb NOT NULL DEFAULT '{}'::jsonb,
  image_url text,
  sort_order integer NOT NULL DEFAULT 0,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dg_product_variants TO authenticated;
GRANT ALL ON public.dg_product_variants TO service_role;
ALTER TABLE public.dg_product_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own dg_product_variants" ON public.dg_product_variants FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- CUSTOMERS
CREATE TABLE public.dg_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text,
  email text,
  phone text,
  address text,
  city text,
  country text,
  tags text[] NOT NULL DEFAULT '{}',
  notes text,
  attributes jsonb NOT NULL DEFAULT '{}'::jsonb,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dg_customers TO authenticated;
GRANT ALL ON public.dg_customers TO service_role;
ALTER TABLE public.dg_customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own dg_customers" ON public.dg_customers FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ORDERS
CREATE TABLE public.dg_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_number text NOT NULL,
  customer_id uuid REFERENCES public.dg_customers(id) ON DELETE SET NULL,
  status dg_order_status NOT NULL DEFAULT 'new',
  payment_status dg_payment_status NOT NULL DEFAULT 'unpaid',
  payment_method text,
  channel text NOT NULL DEFAULT 'direct',
  subtotal numeric NOT NULL DEFAULT 0,
  discount numeric NOT NULL DEFAULT 0,
  tax numeric NOT NULL DEFAULT 0,
  shipping_fee numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'KES',
  shipping_address text,
  shipping_method text,
  tracking_number text,
  placed_at timestamptz NOT NULL DEFAULT now(),
  delivered_at timestamptz,
  notes text,
  internal_notes text,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dg_orders TO authenticated;
GRANT ALL ON public.dg_orders TO service_role;
ALTER TABLE public.dg_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own dg_orders" ON public.dg_orders FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX dg_orders_user_status_idx ON public.dg_orders (user_id, status);

-- ORDER ITEMS
CREATE TABLE public.dg_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES public.dg_orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.dg_products(id) ON DELETE SET NULL,
  variant_id uuid REFERENCES public.dg_product_variants(id) ON DELETE SET NULL,
  name text NOT NULL,
  sku text,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  unit_cost numeric NOT NULL DEFAULT 0,
  discount numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dg_order_items TO authenticated;
GRANT ALL ON public.dg_order_items TO service_role;
ALTER TABLE public.dg_order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own dg_order_items" ON public.dg_order_items FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ORDER EVENTS (timeline)
CREATE TABLE public.dg_order_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES public.dg_orders(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'note',
  title text NOT NULL,
  body text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dg_order_events TO authenticated;
GRANT ALL ON public.dg_order_events TO service_role;
ALTER TABLE public.dg_order_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own dg_order_events" ON public.dg_order_events FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- STOCK MOVEMENTS
CREATE TABLE public.dg_stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.dg_products(id) ON DELETE CASCADE,
  variant_id uuid REFERENCES public.dg_product_variants(id) ON DELETE SET NULL,
  warehouse_id uuid REFERENCES public.dg_warehouses(id) ON DELETE SET NULL,
  type dg_stock_movement_type NOT NULL DEFAULT 'adjustment',
  quantity integer NOT NULL,
  unit_cost numeric,
  reference text,
  notes text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dg_stock_movements TO authenticated;
GRANT ALL ON public.dg_stock_movements TO service_role;
ALTER TABLE public.dg_stock_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own dg_stock_movements" ON public.dg_stock_movements FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- updated_at triggers
CREATE TRIGGER dg_categories_updated BEFORE UPDATE ON public.dg_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER dg_brands_updated BEFORE UPDATE ON public.dg_brands FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER dg_suppliers_updated BEFORE UPDATE ON public.dg_suppliers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER dg_warehouses_updated BEFORE UPDATE ON public.dg_warehouses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER dg_products_updated BEFORE UPDATE ON public.dg_products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER dg_product_variants_updated BEFORE UPDATE ON public.dg_product_variants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER dg_customers_updated BEFORE UPDATE ON public.dg_customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER dg_orders_updated BEFORE UPDATE ON public.dg_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();