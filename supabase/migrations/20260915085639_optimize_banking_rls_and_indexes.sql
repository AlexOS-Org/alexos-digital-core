-- Optimize the banking RLS policies flagged by Supabase's database advisor.
--
-- The scalar subquery evaluates auth.uid() once per statement instead of once
-- per row. Policy semantics are unchanged: each row remains scoped to the
-- authenticated user's user_id.
ALTER POLICY "banking employers owner access"
  ON public.banking_employers
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

ALTER POLICY "banking signals owner access"
  ON public.banking_recruitment_signals
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

ALTER POLICY "banking prospects owner access"
  ON public.banking_employee_prospects
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- Cover the banking_employee_prospects -> crm_contacts foreign key so parent
-- updates/deletes and relationship lookups do not require a child-table scan.
CREATE INDEX IF NOT EXISTS banking_employee_prospects_crm_contact_id_idx
  ON public.banking_employee_prospects (crm_contact_id);
