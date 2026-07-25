import type { Database } from "@/integrations/supabase/types";

export type Contact = Database["public"]["Tables"]["contacts"]["Row"];
export type Lead = Database["public"]["Tables"]["leads"]["Row"];
export type LeadStageHistory = Database["public"]["Tables"]["lead_stage_history"]["Row"];
export type CrmActivity = Database["public"]["Tables"]["crm_activities"]["Row"];
export type CrmTask = Database["public"]["Tables"]["crm_tasks"]["Row"];
export type CrmNote = Database["public"]["Tables"]["crm_notes"]["Row"];
export type CrmAttachment = Database["public"]["Tables"]["crm_attachments"]["Row"];

export type ContactStatus = Database["public"]["Enums"]["contact_status"];
export type LeadStage = Database["public"]["Enums"]["lead_stage"];
export type CrmActivityType = Database["public"]["Enums"]["crm_activity_type"];
export type CrmTaskStatus = Database["public"]["Enums"]["crm_task_status"];

export interface ContactInput {
  id?: string;
  first_name: string;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  job_title?: string | null;
  source?: string | null;
  status?: ContactStatus;
  notes?: string | null;
  tags?: string[];
}

export interface LeadInput {
  id?: string;
  contact_id?: string | null;
  title: string;
  stage?: LeadStage;
  value?: number;
  probability?: number;
  expected_close_date?: string | null;
  source?: string | null;
  notes?: string | null;
}
