-- Harden banking growth trigger function search paths.
--
-- public.banking_growth_set_updated_at() and
-- public.banking_growth_phase3_set_updated_at() were introduced without a
-- fixed search_path, leaving them exposed to search-path hijacking during
-- trigger execution on banking_profiles, banking_products, banking_kpi_*,
-- banking_performance_periods, and banking_kpi_performance.
--
-- This forward-only migration pins a fixed search_path via ALTER FUNCTION.
-- It does not recreate the functions, change grants, alter triggers, or
-- modify RLS. mobile_revoke_device is intentionally untouched: it already
-- sets search_path = '' and requires SECURITY DEFINER because authenticated
-- users have no UPDATE RLS on public.mobile_sync_devices; switching it to
-- INVOKER would break legitimate owner device revocation.

alter function public.banking_growth_set_updated_at()
  set search_path = pg_catalog, public;

alter function public.banking_growth_phase3_set_updated_at()
  set search_path = pg_catalog, public;

-- Verification (run against a non-production copy):
--
--   SELECT proname, prosrc
--   FROM pg_proc p
--   JOIN pg_namespace n ON n.oid = p.pronamespace
--   WHERE n.nspname = 'public'
--     AND proname IN ('banking_growth_set_updated_at','banking_growth_phase3_set_updated_at');
--
-- Each prosrc should contain `search_path = pg_catalog, public` (or the
-- function should carry an equivalent ALTER FUNCTION setting).
--
-- Confirm no grant/behavior change:
--
--   SELECT n.nspname, p.proname, p.prosecdef, pg_get_function_identity_arguments(p.oid)
--   FROM pg_proc p
--   JOIN pg_namespace n ON n.oid = p.pronamespace
--   WHERE n.nspname = 'public'
--     AND proname LIKE 'banking_growth%';
