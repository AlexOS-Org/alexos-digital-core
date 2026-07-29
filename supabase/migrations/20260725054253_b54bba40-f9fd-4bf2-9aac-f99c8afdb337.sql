-- ============================================================
-- AlexOS Orion - CRM V3 CANONICAL FOUNDATION
--
-- This migration is the canonical CRM schema contract.
-- It is intentionally safe against both:
--   1. the already-existing production CRM tables, and
--   2. a clean `supabase db reset` where the retired CRM V2/V1
--      migrations are no-ops.
--
-- Legacy columns are preserved for application compatibility.
-- ============================================================

-- ============================================================
-- ENUMS
-- ============================================================
DO $$ BEGIN
  CREATE TYPE public.contact_status AS ENUM ('lead','active','inactive','archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.lead_stage AS ENUM ('new','contacted','qualified','proposal','negotiation','won','lost');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.crm_activity_type AS ENUM ('call','email','meeting','note','other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.crm_task_status AS ENUM ('pending','done');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- CONTACTS
--
-- The table may already exist from the original CRM V2 migration.
-- On a clean reset it must be created here because that migration
-- has deliberately been retired to a no-op.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'person',
  first_name text,
  last_name text,
  display_name text,
  company_name text,
  email text,
  phone text,
  alternate_phone text,
  website text,
  industry text,
  job_title text,
  address text,
  city text,
  county text,
  country text,
  postal_code text,
  company text,
  status text DEFAULT 'lead',
  source text,
  avatar_url text,
  notes text,
  tags text[] NOT NULL DEFAULT '{}',
  sort_order integer NOT NULL DEFAULT 0,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS first_name text;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS last_name text;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS company text;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS job_title text;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS source text;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS status text;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

UPDATE public.contacts
SET display_name = COALESCE(NULLIF(display_name, ''), NULLIF(concat_ws(' ', first_name, last_name), ''), 'Unnamed Contact')
WHERE display_name IS NULL OR display_name = '';

UPDATE public.contacts
SET first_name = COALESCE(NULLIF(first_name, ''), NULLIF(split_part(display_name, ' ', 1), ''))
WHERE first_name IS NULL OR first_name = '';

UPDATE public.contacts
SET company = COALESCE(company, company_name)
WHERE company IS NULL;

UPDATE public.contacts
SET status = COALESCE(NULLIF(lower(status), ''), 'lead')
WHERE status IS NULL OR status = '';

ALTER TABLE public.contacts ALTER COLUMN status DROP DEFAULT;
ALTER TABLE public.contacts ALTER COLUMN status TYPE public.contact_status
USING CASE lower(coalesce(status, 'lead'))
  WHEN 'lead' THEN 'lead'::public.contact_status
  WHEN 'inactive' THEN 'inactive'::public.contact_status
  WHEN 'archived' THEN 'archived'::public.contact_status
  ELSE 'active'::public.contact_status
END;
ALTER TABLE public.contacts ALTER COLUMN status SET DEFAULT 'lead'::public.contact_status;
ALTER TABLE public.contacts ALTER COLUMN first_name SET NOT NULL;
ALTER TABLE public.contacts ALTER COLUMN display_name SET NOT NULL;

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS contacts_all ON public.contacts;
DROP POLICY IF EXISTS "own contacts" ON public.contacts;
CREATE POLICY "own contacts"
ON public.contacts FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contacts TO authenticated;
GRANT ALL ON public.contacts TO service_role;
CREATE INDEX IF NOT EXISTS contacts_user_idx
ON public.contacts(user_id) WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS update_contacts_updated_at ON public.contacts;
CREATE TRIGGER update_contacts_updated_at
BEFORE UPDATE ON public.contacts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- LEADS
--
-- The table may already exist from the original leads migration.
-- On a clean reset it is created here as the canonical contract.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id uuid,
  contact_id uuid,
  title text,
  stage text DEFAULT 'new',
  value numeric(14,2) DEFAULT 0,
  probability integer DEFAULT 20,
  company text,
  source text,
  status text DEFAULT 'open',
  estimated_value numeric DEFAULT 0,
  expected_close_date date,
  assigned_to uuid,
  notes text,
  sort_order integer NOT NULL DEFAULT 0,
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS contact_id uuid;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS stage text DEFAULT 'new';
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS value numeric(14,2) DEFAULT 0;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS probability integer DEFAULT 20;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS expected_close_date date;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS source text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

UPDATE public.leads
SET title = COALESCE(NULLIF(title, ''), COALESCE(company, 'Untitled Lead'))
WHERE title IS NULL OR title = '';

UPDATE public.leads
SET stage = COALESCE(NULLIF(lower(stage), ''), 'new')
WHERE stage IS NULL OR stage = '';

UPDATE public.leads
SET probability = LEAST(100, GREATEST(0, COALESCE(probability, 20)))
WHERE probability IS NULL OR probability < 0 OR probability > 100;

UPDATE public.leads
SET value = COALESCE(value, estimated_value, 0)
WHERE value IS NULL;

ALTER TABLE public.leads ALTER COLUMN stage DROP DEFAULT;
ALTER TABLE public.leads ALTER COLUMN stage TYPE public.lead_stage
USING CASE lower(coalesce(stage,'new'))
  WHEN 'contacted' THEN 'contacted'::public.lead_stage
  WHEN 'qualified' THEN 'qualified'::public.lead_stage
  WHEN 'proposal' THEN 'proposal'::public.lead_stage
  WHEN 'negotiation' THEN 'negotiation'::public.lead_stage
  WHEN 'won' THEN 'won'::public.lead_stage
  WHEN 'lost' THEN 'lost'::public.lead_stage
  ELSE 'new'::public.lead_stage
END;
ALTER TABLE public.leads ALTER COLUMN stage SET DEFAULT 'new'::public.lead_stage;
ALTER TABLE public.leads ALTER COLUMN title SET NOT NULL;
ALTER TABLE public.leads ALTER COLUMN probability SET DEFAULT 20;
ALTER TABLE public.leads ALTER COLUMN probability SET NOT NULL;
ALTER TABLE public.leads ALTER COLUMN value SET DEFAULT 0;
ALTER TABLE public.leads ALTER COLUMN value SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'leads_contact_id_fkey'
      AND conrelid = 'public.leads'::regclass
  ) THEN
    ALTER TABLE public.leads
      ADD CONSTRAINT leads_contact_id_fkey
      FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE SET NULL;
  END IF;
END $$;

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS leads_all ON public.leads;
DROP POLICY IF EXISTS "own leads" ON public.leads;
CREATE POLICY "own leads"
ON public.leads FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;
CREATE INDEX IF NOT EXISTS leads_user_stage_idx
ON public.leads(user_id, stage) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS leads_contact_idx ON public.leads(contact_id);

DROP TRIGGER IF EXISTS update_leads_updated_at ON public.leads;
CREATE TRIGGER update_leads_updated_at
BEFORE UPDATE ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- LEAD STAGE HISTORY
-- ============================================================
CREATE TABLE IF NOT EXISTS public.lead_stage_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  from_stage public.lead_stage,
  to_stage public.lead_stage NOT NULL,
  changed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_stage_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own stage history" ON public.lead_stage_history;
CREATE POLICY "own stage history"
ON public.lead_stage_history FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
GRANT SELECT, INSERT ON public.lead_stage_history TO authenticated;
GRANT ALL ON public.lead_stage_history TO service_role;
CREATE INDEX IF NOT EXISTS lead_stage_history_lead_idx
ON public.lead_stage_history(lead_id, changed_at DESC);

CREATE OR REPLACE FUNCTION public.log_lead_stage_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.lead_stage_history(user_id, lead_id, from_stage, to_stage)
    VALUES (NEW.user_id, NEW.id, NULL, NEW.stage);
  ELSIF TG_OP = 'UPDATE' AND NEW.stage IS DISTINCT FROM OLD.stage THEN
    INSERT INTO public.lead_stage_history(user_id, lead_id, from_stage, to_stage)
    VALUES (NEW.user_id, NEW.id, OLD.stage, NEW.stage);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS leads_log_stage_change ON public.leads;
CREATE TRIGGER leads_log_stage_change
AFTER INSERT OR UPDATE OF stage ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.log_lead_stage_change();

-- ============================================================
-- CRM ACTIVITIES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.crm_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES public.contacts(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  type public.crm_activity_type NOT NULL DEFAULT 'note',
  subject text NOT NULL,
  body text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own crm activities" ON public.crm_activities;
CREATE POLICY "own crm activities" ON public.crm_activities FOR ALL USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_activities TO authenticated;
GRANT ALL ON public.crm_activities TO service_role;
CREATE INDEX IF NOT EXISTS crm_activities_contact_idx ON public.crm_activities(contact_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS crm_activities_lead_idx ON public.crm_activities(lead_id, occurred_at DESC);
DROP TRIGGER IF EXISTS update_crm_activities_updated_at ON public.crm_activities;
CREATE TRIGGER update_crm_activities_updated_at BEFORE UPDATE ON public.crm_activities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- CRM TASKS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.crm_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES public.contacts(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  title text NOT NULL,
  due_date date,
  status public.crm_task_status NOT NULL DEFAULT 'pending',
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.crm_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own crm tasks" ON public.crm_tasks;
CREATE POLICY "own crm tasks" ON public.crm_tasks FOR ALL USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_tasks TO authenticated;
GRANT ALL ON public.crm_tasks TO service_role;
CREATE INDEX IF NOT EXISTS crm_tasks_contact_idx ON public.crm_tasks(contact_id);
CREATE INDEX IF NOT EXISTS crm_tasks_lead_idx ON public.crm_tasks(lead_id);
DROP TRIGGER IF EXISTS update_crm_tasks_updated_at ON public.crm_tasks;
CREATE TRIGGER update_crm_tasks_updated_at BEFORE UPDATE ON public.crm_tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- CRM NOTES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.crm_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES public.contacts(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.crm_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own crm notes" ON public.crm_notes;
CREATE POLICY "own crm notes" ON public.crm_notes FOR ALL USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_notes TO authenticated;
GRANT ALL ON public.crm_notes TO service_role;
CREATE INDEX IF NOT EXISTS crm_notes_contact_idx ON public.crm_notes(contact_id, created_at DESC);
CREATE INDEX IF NOT EXISTS crm_notes_lead_idx ON public.crm_notes(lead_id, created_at DESC);
DROP TRIGGER IF EXISTS update_crm_notes_updated_at ON public.crm_notes;
CREATE TRIGGER update_crm_notes_updated_at BEFORE UPDATE ON public.crm_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- CRM ATTACHMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.crm_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES public.contacts(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  name text NOT NULL,
  url text NOT NULL,
  size_bytes bigint,
  mime_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.crm_attachments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own crm attachments" ON public.crm_attachments;
CREATE POLICY "own crm attachments" ON public.crm_attachments FOR ALL USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_attachments TO authenticated;
GRANT ALL ON public.crm_attachments TO service_role;
CREATE INDEX IF NOT EXISTS crm_attachments_contact_idx ON public.crm_attachments(contact_id);
CREATE INDEX IF NOT EXISTS crm_attachments_lead_idx ON public.crm_attachments(lead_id);
