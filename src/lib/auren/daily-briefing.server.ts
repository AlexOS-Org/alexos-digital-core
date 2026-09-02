import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import {
  buildDailyBriefing,
  type DailyBriefing,
  type DailyBriefingActivity,
  type DailyBriefingLead,
  type DailyBriefingTask,
} from "./daily-briefing";

type ServerSupabaseClient = SupabaseClient<Database>;

export const DAILY_BRIEFING_PROJECTIONS = {
  leads:
    "id, title, company, value, estimated_value, probability, stage, status, expected_close_date, contact_id",
  tasks: "id, title, due_date, status, lead_id, contact_id",
  activities: "id, subject, type, occurred_at, lead_id, contact_id",
  contacts: "id, display_name",
} as const;

export interface AurenDailyBriefingResponse {
  status: "ready" | "no_data";
  briefing: DailyBriefing;
  evidence: {
    sourceType: "first_party_crm";
    sourceKey: "crm-daily-briefing";
    observedAt: string;
    confidence: "high" | "insufficient";
    rowCount: number;
    readOnly: true;
  };
}

export async function getAurenDailyBriefingForUser(context: {
  supabase: ServerSupabaseClient;
  userId: string;
  now?: Date;
}): Promise<AurenDailyBriefingResponse> {
  const [leadsResult, tasksResult, activitiesResult, contactsResult] = await Promise.all([
    context.supabase
      .from("leads")
      .select(DAILY_BRIEFING_PROJECTIONS.leads)
      .eq("user_id", context.userId)
      .is("deleted_at", null)
      .limit(500),
    context.supabase
      .from("crm_tasks")
      .select(DAILY_BRIEFING_PROJECTIONS.tasks)
      .eq("user_id", context.userId)
      .limit(500),
    context.supabase
      .from("crm_activities")
      .select(DAILY_BRIEFING_PROJECTIONS.activities)
      .eq("user_id", context.userId)
      .limit(500),
    context.supabase
      .from("contacts")
      .select(DAILY_BRIEFING_PROJECTIONS.contacts)
      .eq("user_id", context.userId)
      .is("deleted_at", null)
      .limit(500),
  ]);

  const failed = [leadsResult, tasksResult, activitiesResult, contactsResult].find(
    (result) => result.error,
  );
  if (failed?.error) throw failed.error;

  const contacts = new Map(
    (contactsResult.data ?? []).map((contact) => [contact.id, contact.display_name]),
  );
  const leads: DailyBriefingLead[] = (leadsResult.data ?? []).map((lead) => ({
    id: lead.id,
    title: lead.title,
    company: lead.company,
    value: lead.value ?? lead.estimated_value,
    probability: lead.probability,
    stage: lead.stage,
    status: lead.status,
    expectedCloseDate: lead.expected_close_date,
    contactName: lead.contact_id ? (contacts.get(lead.contact_id) ?? null) : null,
  }));
  const tasks: DailyBriefingTask[] = (tasksResult.data ?? []).map((task) => ({
    id: task.id,
    title: task.title,
    dueDate: task.due_date,
    status: task.status,
    leadId: task.lead_id,
    contactName: task.contact_id ? (contacts.get(task.contact_id) ?? null) : null,
  }));
  const activities: DailyBriefingActivity[] = (activitiesResult.data ?? []).map((activity) => ({
    id: activity.id,
    subject: activity.subject,
    type: activity.type,
    occurredAt: activity.occurred_at,
    leadId: activity.lead_id,
    contactName: activity.contact_id ? (contacts.get(activity.contact_id) ?? null) : null,
  }));
  const briefing = buildDailyBriefing({ now: context.now, leads, tasks, activities });
  const rowCount = leads.length + tasks.length + activities.length;
  const observedAt = (context.now ?? new Date()).toISOString();

  return {
    status: briefing.status,
    briefing,
    evidence: {
      sourceType: "first_party_crm",
      sourceKey: "crm-daily-briefing",
      observedAt,
      confidence: rowCount > 0 ? "high" : "insufficient",
      rowCount,
      readOnly: true,
    },
  };
}
