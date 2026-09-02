import { describe, expect, it } from "vitest";
import {
  buildDailyBriefing,
  type DailyBriefingActivity,
  type DailyBriefingLead,
  type DailyBriefingTask,
} from "./daily-briefing";

const now = new Date("2026-09-01T09:00:00.000Z");

const lead = (overrides: Partial<DailyBriefingLead> = {}): DailyBriefingLead => ({
  id: "lead-1",
  title: "School procurement",
  company: "Nuvora Schools",
  value: 100000,
  probability: 60,
  stage: "proposal",
  status: "open",
  expectedCloseDate: "2026-09-03",
  contactName: "Amina Otieno",
  ...overrides,
});

const task = (overrides: Partial<DailyBriefingTask> = {}): DailyBriefingTask => ({
  id: "task-1",
  title: "Send proposal",
  dueDate: "2026-09-01",
  status: "pending",
  leadId: "lead-1",
  contactName: "Amina Otieno",
  ...overrides,
});

const activity = (overrides: Partial<DailyBriefingActivity> = {}): DailyBriefingActivity => ({
  id: "activity-1",
  subject: "Proposal review",
  type: "meeting",
  occurredAt: "2026-09-01T11:00:00.000Z",
  leadId: "lead-1",
  contactName: "Amina Otieno",
  ...overrides,
});

describe("daily briefing", () => {
  it("prioritizes a high-value meeting above a task and a deal closing later this week", () => {
    const briefing = buildDailyBriefing({
      now,
      leads: [lead()],
      tasks: [task({ dueDate: "2026-08-31" })],
      activities: [activity()],
    });

    expect(briefing.topPriority).toMatchObject({
      type: "meeting",
      id: "activity-1",
      priority: "high",
    });
    expect(briefing.metrics).toEqual({
      openPipeline: 100000,
      closingThisWeek: 1,
      meetingsToday: 1,
      actionItems: 1,
    });
  });

  it("flags open leads with no recent activity as stale", () => {
    const briefing = buildDailyBriefing({
      now,
      leads: [lead({ expectedCloseDate: "2026-09-15" })],
      tasks: [],
      activities: [activity({ occurredAt: "2026-08-20T10:00:00.000Z" })],
    });

    expect(briefing.pipelineAlerts.stale).toHaveLength(1);
    expect(briefing.pipelineAlerts.stale[0]).toMatchObject({
      id: "lead-1",
      title: "School procurement",
    });
    expect(briefing.topPriority?.priority).toBe("medium");
  });

  it("returns a truthful unavailable priority when no CRM or task data exists", () => {
    const briefing = buildDailyBriefing({ now, leads: [], tasks: [], activities: [] });

    expect(briefing.status).toBe("no_data");
    expect(briefing.topPriority).toBeNull();
    expect(briefing.suggestedActions).toEqual([
      "Record a CRM lead, task, or activity to build today’s briefing.",
    ]);
  });
});
