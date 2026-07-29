-- ============================================================
-- RETIRED MIGRATION
-- CRM V2 contacts foundation was superseded by the canonical
-- CRM V3 migration 20260725054253.
--
-- This migration is intentionally a no-op so a fresh database
-- reset does not create the obsolete contacts/activities/tasks/
-- notes/attachments schema before CRM V3.
-- ============================================================

DO $$
BEGIN
  NULL;
END
$$;
