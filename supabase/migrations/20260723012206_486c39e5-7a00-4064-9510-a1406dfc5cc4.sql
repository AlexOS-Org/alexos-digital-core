-- ============================================================
-- Historical migration
-- ============================================================
--
-- This migration originally attempted to create a second,
-- conflicting Bills schema.
--
-- The Bills foundation was already created by:
--
--   20260722113131_create_bills_table.sql
--
-- This migration is intentionally retained as a no-op because
-- its version is already recorded in Supabase migration history.
--
-- The final Bills schema is reconciled by:
--
--   20260726210000_reconcile_bills_schema.sql
--
-- DO NOT REMOVE THIS MIGRATION.
-- ============================================================

DO $$
BEGIN
    NULL;
END $$;
