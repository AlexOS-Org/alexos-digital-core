-- Remove the redundant user index; idx_leads_user already covers this foreign key.
DROP INDEX IF EXISTS public.idx_leads_user_id;
