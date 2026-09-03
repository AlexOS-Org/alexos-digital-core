import { describe, expect, it } from "vitest";
import { aurenDailyBriefingKey, dailyBriefingQueryKey } from "./daily-briefing.api";
import { DAILY_BRIEFING_PROJECTIONS } from "./daily-briefing.server";

describe("Daily Briefing query key", () => {
  it("isolates cached briefings by authenticated user", () => {
    expect(dailyBriefingQueryKey("user-a")).toEqual([...aurenDailyBriefingKey, "user-a"]);
    expect(dailyBriefingQueryKey("user-a")).not.toEqual(dailyBriefingQueryKey("user-b"));
  });

  it("does not use the shared base key as a user cache key", () => {
    expect(dailyBriefingQueryKey("user-a")).not.toEqual(aurenDailyBriefingKey);
  });

  it("keeps ownership and soft-delete filters out of selected payload columns", () => {
    for (const projection of Object.values(DAILY_BRIEFING_PROJECTIONS)) {
      expect(projection).not.toContain("user_id");
      expect(projection).not.toContain("deleted_at");
    }
    expect(DAILY_BRIEFING_PROJECTIONS.leads).toContain("expected_close_date");
    expect(DAILY_BRIEFING_PROJECTIONS.activities).toContain("occurred_at");
  });
});
