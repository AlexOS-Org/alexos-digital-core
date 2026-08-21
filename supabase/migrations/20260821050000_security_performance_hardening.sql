-- Security and performance hardening for the frozen AlexOS architecture.
--
-- The auth.uid() rewrites are semantics-preserving: the function is evaluated
-- once per statement instead of once per row. The catalogue policy split keeps
-- the same effective visibility for anon and authenticated callers while
-- avoiding duplicate permissive SELECT policies.

-- Evaluate owner checks once per statement on existing user-scoped policies.
DROP POLICY IF EXISTS "own accounts" ON public.accounts;
CREATE POLICY "own accounts" ON public.accounts
  FOR ALL TO public
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "own budgets" ON public.budgets;
CREATE POLICY "own budgets" ON public.budgets
  FOR ALL TO public
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "own expected_money" ON public.expected_money;
CREATE POLICY "own expected_money" ON public.expected_money
  FOR ALL TO public
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "own debts" ON public.debts;
CREATE POLICY "own debts" ON public.debts
  FOR ALL TO public
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "own goals" ON public.goals;
CREATE POLICY "own goals" ON public.goals
  FOR ALL TO public
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "own goal contributions" ON public.goal_contributions;
CREATE POLICY "own goal contributions" ON public.goal_contributions
  FOR ALL TO public
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users manage own customers" ON public.customers;
CREATE POLICY "Users manage own customers" ON public.customers
  FOR ALL TO public
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS activities_all ON public.activities;
CREATE POLICY activities_all ON public.activities
  FOR ALL TO public
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS tasks_all ON public.tasks;
CREATE POLICY tasks_all ON public.tasks
  FOR ALL TO public
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS notes_all ON public.notes;
CREATE POLICY notes_all ON public.notes
  FOR ALL TO public
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS attachments_all ON public.attachments;
CREATE POLICY attachments_all ON public.attachments
  FOR ALL TO public
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users manage their own bills" ON public.bills;
CREATE POLICY "Users manage their own bills" ON public.bills
  FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "own crm notes" ON public.crm_notes;
CREATE POLICY "own crm notes" ON public.crm_notes
  FOR ALL TO public
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "own crm attachments" ON public.crm_attachments;
CREATE POLICY "own crm attachments" ON public.crm_attachments
  FOR ALL TO public
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users manage their own marketing campaigns" ON public.marketing_campaigns;
CREATE POLICY "Users manage their own marketing campaigns" ON public.marketing_campaigns
  FOR ALL TO public
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users manage their own ad creatives" ON public.ad_creatives;
CREATE POLICY "Users manage their own ad creatives" ON public.ad_creatives
  FOR ALL TO public
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- Remove four redundant transaction policies. The existing ALL policy has the
-- same public owner predicate and already covers SELECT/INSERT/UPDATE/DELETE.
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can update their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can delete their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "own transactions" ON public.transactions;
CREATE POLICY "own transactions" ON public.transactions
  FOR ALL TO public
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- DailyGear owner policies are split by command so the authenticated role has
-- one effective SELECT policy alongside the public catalogue predicate.
DROP POLICY IF EXISTS "Public can read brands of published stores" ON public.dg_brands;
DROP POLICY IF EXISTS "own dg_brands" ON public.dg_brands;
CREATE POLICY "Public can read brands of published stores" ON public.dg_brands
  FOR SELECT TO anon
  USING ((deleted_at IS NULL) AND dg_is_published_store(user_id));
CREATE POLICY "own dg_brands select" ON public.dg_brands
  FOR SELECT TO authenticated
  USING (((select auth.uid()) = user_id) OR ((deleted_at IS NULL) AND dg_is_published_store(user_id)));
CREATE POLICY "own dg_brands insert" ON public.dg_brands
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "own dg_brands update" ON public.dg_brands
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "own dg_brands delete" ON public.dg_brands
  FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Public can read categories of published stores" ON public.dg_categories;
DROP POLICY IF EXISTS "own dg_categories" ON public.dg_categories;
CREATE POLICY "Public can read categories of published stores" ON public.dg_categories
  FOR SELECT TO anon
  USING ((deleted_at IS NULL) AND dg_is_published_store(user_id));
CREATE POLICY "own dg_categories select" ON public.dg_categories
  FOR SELECT TO authenticated
  USING (((select auth.uid()) = user_id) OR ((deleted_at IS NULL) AND dg_is_published_store(user_id)));
CREATE POLICY "own dg_categories insert" ON public.dg_categories
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "own dg_categories update" ON public.dg_categories
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "own dg_categories delete" ON public.dg_categories
  FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Public can read publishable products of published stores" ON public.dg_products;
DROP POLICY IF EXISTS "own dg_products" ON public.dg_products;
CREATE POLICY "Public can read publishable products of published stores" ON public.dg_products
  FOR SELECT TO anon
  USING ((deleted_at IS NULL) AND (status = 'active'::dg_product_status) AND (availability_confirmed = true) AND dg_is_published_store(user_id));
CREATE POLICY "own dg_products select" ON public.dg_products
  FOR SELECT TO authenticated
  USING (((select auth.uid()) = user_id) OR ((deleted_at IS NULL) AND (status = 'active'::dg_product_status) AND (availability_confirmed = true) AND dg_is_published_store(user_id)));
CREATE POLICY "own dg_products insert" ON public.dg_products
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "own dg_products update" ON public.dg_products
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "own dg_products delete" ON public.dg_products
  FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Public can read publishable variants of published stores" ON public.dg_product_variants;
DROP POLICY IF EXISTS "own dg_product_variants" ON public.dg_product_variants;
CREATE POLICY "Public can read publishable variants of published stores" ON public.dg_product_variants
  FOR SELECT TO anon
  USING ((deleted_at IS NULL) AND (availability_confirmed = true) AND (EXISTS (
    SELECT 1
    FROM dg_products p
    WHERE p.id = dg_product_variants.product_id
      AND p.deleted_at IS NULL
      AND p.status = 'active'::dg_product_status
      AND p.availability_confirmed = true
      AND dg_is_published_store(p.user_id)
  )));
CREATE POLICY "own dg_product_variants select" ON public.dg_product_variants
  FOR SELECT TO authenticated
  USING (((select auth.uid()) = user_id) OR ((deleted_at IS NULL) AND (availability_confirmed = true) AND (EXISTS (
    SELECT 1
    FROM dg_products p
    WHERE p.id = dg_product_variants.product_id
      AND p.deleted_at IS NULL
      AND p.status = 'active'::dg_product_status
      AND p.availability_confirmed = true
      AND dg_is_published_store(p.user_id)
  ))));
CREATE POLICY "own dg_product_variants insert" ON public.dg_product_variants
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "own dg_product_variants update" ON public.dg_product_variants
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "own dg_product_variants delete" ON public.dg_product_variants
  FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Published storefronts are public" ON public.dg_storefronts;
DROP POLICY IF EXISTS "Owners manage their storefront" ON public.dg_storefronts;
CREATE POLICY "Published storefronts are public" ON public.dg_storefronts
  FOR SELECT TO anon
  USING (published = true);
CREATE POLICY "Owners manage their storefront select" ON public.dg_storefronts
  FOR SELECT TO authenticated
  USING (((select auth.uid()) = user_id) OR (published = true));
CREATE POLICY "Owners manage their storefront insert" ON public.dg_storefronts
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Owners manage their storefront update" ON public.dg_storefronts
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Owners manage their storefront delete" ON public.dg_storefronts
  FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "own dg_suppliers" ON public.dg_suppliers;
CREATE POLICY "own dg_suppliers" ON public.dg_suppliers
  FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "own dg_warehouses" ON public.dg_warehouses;
CREATE POLICY "own dg_warehouses" ON public.dg_warehouses
  FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "own dg_customers" ON public.dg_customers;
CREATE POLICY "own dg_customers" ON public.dg_customers
  FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "own dg_orders" ON public.dg_orders;
CREATE POLICY "own dg_orders" ON public.dg_orders
  FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "own dg_order_items" ON public.dg_order_items;
CREATE POLICY "own dg_order_items" ON public.dg_order_items
  FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "own dg_order_events" ON public.dg_order_events;
CREATE POLICY "own dg_order_events" ON public.dg_order_events
  FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "own dg_stock_movements" ON public.dg_stock_movements;
CREATE POLICY "own dg_stock_movements" ON public.dg_stock_movements
  FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "own dg_product_evidence" ON public.dg_product_evidence;
CREATE POLICY "own dg_product_evidence" ON public.dg_product_evidence
  FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- Query-backed DailyGear relation indexes. These support order detail/event
-- lookups, variant-by-product reads and customer/order views.
CREATE INDEX IF NOT EXISTS dg_product_variants_product_id_idx
  ON public.dg_product_variants (product_id);
CREATE INDEX IF NOT EXISTS dg_orders_customer_id_idx
  ON public.dg_orders (customer_id);
CREATE INDEX IF NOT EXISTS dg_order_items_order_id_idx
  ON public.dg_order_items (order_id);
CREATE INDEX IF NOT EXISTS dg_order_events_order_id_idx
  ON public.dg_order_events (order_id);
