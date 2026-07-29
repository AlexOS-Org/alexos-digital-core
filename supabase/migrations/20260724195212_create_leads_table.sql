-- ============================================================
-- RETIRED MIGRATION
-- CRM V3 is now defined by the canonical migration
-- 20260725054253_b54bba40-f9fd-4bf2-9aac-f99c8afdb337.sql.
-- This historical migration is intentionally a no-op so a fresh
-- reset does not apply an obsolete text-based leads contract.
-- ============================================================

DO $$
BEGIN
  NULL;
END
$$;
