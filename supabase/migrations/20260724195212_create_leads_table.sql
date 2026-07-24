-- ============================================================
-- CRM V3 - Upgrade Existing Leads Table
-- AlexOS Orion
-- ============================================================

ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS company text;

ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS source text;

ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS stage text DEFAULT 'new';

ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS status text DEFAULT 'open';

ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS estimated_value numeric(14,2) DEFAULT 0;

ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS probability integer DEFAULT 0;

ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS expected_close_date date;

ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS assigned_to uuid
REFERENCES auth.users(id)
ON DELETE SET NULL;

ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS notes text;

ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_leads_user
ON public.leads(user_id);

CREATE INDEX IF NOT EXISTS idx_leads_contact
ON public.leads(contact_id);

CREATE INDEX IF NOT EXISTS idx_leads_stage
ON public.leads(stage);

-- Only create this index if the column exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'leads'
          AND column_name = 'status'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_leads_status
        ON public.leads(status);
    END IF;
END $$;

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'leads'
          AND policyname = 'leads_all'
    ) THEN
        CREATE POLICY leads_all
        ON public.leads
        FOR ALL
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;