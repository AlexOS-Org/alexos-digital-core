export type DailyBriefingPriority = "urgent" | "high" | "medium" | "low";

export interface DailyBriefingLead {
  id: string;
  title: string;
  company: string | null;
  value: number | null;
  probability: number | null;
  stage: string | null;
  status: string | null;
  expectedCloseDate: string | null;
  contactName: string | null;
}

export interface DailyBriefingTask {
  id: string;
  title: string;
  dueDate: string | null;
  status: string | null;
  leadId: string | null;
  contactName: string | null;
}

export interface DailyBriefingActivity {
  id: string;
  subject: string;
  type: string | null;
  occurredAt: string;
  leadId: string | null;
  contactName: string | null;
}

export interface DailyBriefingItem {
  type: "task" | "meeting" | "lead";
  id: string;
  title: string;
  detail: string;
  priority: DailyBriefingPriority;
  leadId: string | null;
}

export interface DailyBriefingLeadAlert {
  id: string;
  title: string;
  company: string | null;
  value: number;
  expectedCloseDate: string | null;
  reason: string;
}

export interface DailyBriefing {
  asOf: string;
  status: "ready" | "no_data";
  metrics: {
    openPipeline: number;
    closingThisWeek: number;
    meetingsToday: number;
    actionItems: number;
  };
  topPriority: DailyBriefingItem | null;
  todayMeetings: DailyBriefingActivity[];
  overdueTasks: DailyBriefingTask[];
  pipelineAlerts: {
    stale: DailyBriefingLeadAlert[];
    closingSoon: DailyBriefingLeadAlert[];
  };
  suggestedActions: string[];
}

export interface DailyBriefingInput {
  now?: Date;
  leads: DailyBriefingLead[];
  tasks: DailyBriefingTask[];
  activities: DailyBriefingActivity[];
}

const CLOSED_LEAD_STATUSES = new Set(["won", "lost", "closed"]);
const DONE_TASK_STATUSES = new Set(["done", "completed", "cancelled"]);

function dateKey(value: Date | string): string {
  return (value instanceof Date ? value : new Date(value)).toISOString().slice(0, 10);
}

function addDays(date: Date, days: number): string {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return dateKey(next);
}

function daysSince(dateValue: string, today: string): number {
  const date = new Date(`${dateValue.slice(0, 10)}T00:00:00Z`).getTime();
  const current = new Date(`${today}T00:00:00Z`).getTime();
  return Math.floor((current - date) / 86_400_000);
}

function isOpenLead(lead: DailyBriefingLead): boolean {
  return !CLOSED_LEAD_STATUSES.has((lead.status ?? "").toLowerCase());
}

function amount(value: number | null): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function leadAlert(lead: DailyBriefingLead, reason: string): DailyBriefingLeadAlert {
  return {
    id: lead.id,
    title: lead.title,
    company: lead.company,
    value: amount(lead.value),
    expectedCloseDate: lead.expectedCloseDate,
    reason,
  };
}

export function buildDailyBriefing(input: DailyBriefingInput): DailyBriefing {
  const now = input.now ?? new Date();
  const today = dateKey(now);
  const weekEnd = addDays(now, 6);
  const tomorrow = addDays(now, 1);
  const openLeads = input.leads.filter(isOpenLead);
  const leadById = new Map(input.leads.map((lead) => [lead.id, lead]));
  const activeTasks = input.tasks.filter(
    (task) => !DONE_TASK_STATUSES.has((task.status ?? "").toLowerCase()),
  );
  const overdueTasks = activeTasks.filter((task) => Boolean(task.dueDate && task.dueDate < today));
  const todayMeetings = input.activities
    .filter(
      (activity) =>
        dateKey(activity.occurredAt) === today &&
        ["meeting", "call", "demo"].includes((activity.type ?? "").toLowerCase()),
    )
    .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
  const closingSoon = openLeads
    .filter(
      (lead) =>
        Boolean(lead.expectedCloseDate) &&
        lead.expectedCloseDate! >= today &&
        lead.expectedCloseDate! <= weekEnd,
    )
    .sort((a, b) => amount(b.value) - amount(a.value))
    .map((lead) => leadAlert(lead, "Expected close date falls within the next seven days."));
  const stale = openLeads
    .map((lead) => {
      const related = input.activities
        .filter((activity) => activity.leadId === lead.id)
        .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
      const lastActivity = related[0]?.occurredAt;
      return { lead, lastActivity };
    })
    .filter(({ lastActivity }) => !lastActivity || daysSince(lastActivity, today) >= 7)
    .sort((a, b) => amount(b.lead.value) - amount(a.lead.value))
    .map(({ lead, lastActivity }) =>
      leadAlert(
        lead,
        lastActivity
          ? `No recorded activity for ${daysSince(lastActivity, today)} days.`
          : "No recorded activity is linked to this open lead.",
      ),
    );

  const highValueMeeting = todayMeetings
    .map((meeting) => ({
      meeting,
      lead: meeting.leadId ? leadById.get(meeting.leadId) : undefined,
    }))
    .filter(({ lead }) => lead && amount(lead.value) >= 50_000)
    .sort((a, b) => amount(b.lead?.value ?? null) - amount(a.lead?.value ?? null))[0];
  const urgentTask = overdueTasks[0];
  const closingImmediately = closingSoon.find(
    (alert) => alert.expectedCloseDate === today || alert.expectedCloseDate === tomorrow,
  );
  const staleLead = stale[0];

  let topPriority: DailyBriefingItem | null = null;
  if (closingImmediately) {
    topPriority = {
      type: "lead",
      id: closingImmediately.id,
      title: closingImmediately.title,
      detail: "Open opportunity expected to close today or tomorrow.",
      priority: "urgent",
      leadId: closingImmediately.id,
    };
  } else if (highValueMeeting) {
    topPriority = {
      type: "meeting",
      id: highValueMeeting.meeting.id,
      title: highValueMeeting.meeting.subject,
      detail: `Prepare for ${highValueMeeting.lead?.company ?? highValueMeeting.lead?.title ?? "the opportunity"}.`,
      priority: "high",
      leadId: highValueMeeting.meeting.leadId,
    };
  } else if (staleLead) {
    topPriority = {
      type: "lead",
      id: staleLead.id,
      title: staleLead.title,
      detail: staleLead.reason,
      priority: "medium",
      leadId: staleLead.id,
    };
  } else if (urgentTask) {
    topPriority = {
      type: "task",
      id: urgentTask.id,
      title: urgentTask.title,
      detail: `Overdue CRM task${urgentTask.contactName ? ` for ${urgentTask.contactName}` : ""}.`,
      priority: "medium",
      leadId: urgentTask.leadId,
    };
  } else if (activeTasks[0]) {
    topPriority = {
      type: "task",
      id: activeTasks[0].id,
      title: activeTasks[0].title,
      detail: "Open CRM action item.",
      priority: "low",
      leadId: activeTasks[0].leadId,
    };
  }

  const suggestedActions = topPriority
    ? [
        topPriority.detail,
        ...(closingSoon.length > 0 ? ["Review opportunities closing this week."] : []),
        ...(stale.length > 0 ? ["Schedule a next touch for stale open opportunities."] : []),
      ].slice(0, 3)
    : ["Record a CRM lead, task, or activity to build today’s briefing."];

  return {
    asOf: now.toISOString(),
    status:
      input.leads.length || input.tasks.length || input.activities.length ? "ready" : "no_data",
    metrics: {
      openPipeline: openLeads.reduce((sum, lead) => sum + amount(lead.value), 0),
      closingThisWeek: closingSoon.length,
      meetingsToday: todayMeetings.length,
      actionItems: activeTasks.length,
    },
    topPriority,
    todayMeetings,
    overdueTasks,
    pipelineAlerts: { stale, closingSoon },
    suggestedActions,
  };
}
