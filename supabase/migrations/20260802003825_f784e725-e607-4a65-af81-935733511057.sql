REVOKE ALL ON FUNCTION public.log_lead_stage_change() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.seed_default_accounts() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;