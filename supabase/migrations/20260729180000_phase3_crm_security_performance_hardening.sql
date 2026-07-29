-- Phase 3 CRM hardening: tighten trigger function execution and improve RLS/query planning.
REVOKE EXECUTE ON FUNCTION public.log_lead_stage_change() FROM PUBLIC, anon, authenticated;

-- Remove duplicate lead contact index; keep the canonical contact index.
DROP INDEX IF EXISTS public.idx_leads_contact_id;

-- Cover foreign keys and the user-scoped CRM access patterns.
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON public.leads (user_id);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON public.leads (assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_customer_id ON public.leads (customer_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_user_id ON public.crm_activities (user_id);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_user_id ON public.crm_tasks (user_id);
CREATE INDEX IF NOT EXISTS idx_lead_stage_history_user_id ON public.lead_stage_history (user_id);

-- RLS policies: evaluate auth.uid() once per statement instead of once per row.
DROP POLICY IF EXISTS "own leads" ON public.leads;
CREATE POLICY "own leads" ON public.leads
  FOR ALL TO public
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "own contacts" ON public.contacts;
CREATE POLICY "own contacts" ON public.contacts
  FOR ALL TO public
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "own crm activities" ON public.crm_activities;
CREATE POLICY "own crm activities" ON public.crm_activities
  FOR ALL TO public
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "own crm tasks" ON public.crm_tasks;
CREATE POLICY "own crm tasks" ON public.crm_tasks
  FOR ALL TO public
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "own stage history" ON public.lead_stage_history;
CREATE POLICY "own stage history" ON public.lead_stage_history
  FOR ALL TO public
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
