import type { Database } from "@/integrations/supabase/types";

export type Contact = Database["public"]["Tables"]["contacts"]["Row"];

export type ContactInsert = Database["public"]["Tables"]["contacts"]["Insert"];

export type ContactUpdate = Database["public"]["Tables"]["contacts"]["Update"];

export type ContactStatus = Contact["status"];

export type ContactType = Contact["type"];

export interface ContactFormInput {
  first_name?: string;
  last_name?: string;
  display_name: string;
  company_name?: string;
  email?: string;
  phone?: string;
  alternate_phone?: string;
  website?: string;
  industry?: string;
  job_title?: string;
  address?: string;
  city?: string;
  county?: string;
  country?: string;
  postal_code?: string;
  status?: string;
  source?: string;
  notes?: string;
}
