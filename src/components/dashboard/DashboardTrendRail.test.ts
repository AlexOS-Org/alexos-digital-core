import { describe, expect, it } from "vitest";
import { dashboardTrendRailMagnitudeClass } from "./DashboardTrendRail.utils";

describe("dashboardTrendRailMagnitudeClass", () => {
  it.each([
    [0, "w-1/12"],
    [10, "w-1/4"],
    [-24.9, "w-1/4"],
    [25, "w-1/2"],
    [50, "w-3/4"],
    [-75, "w-full"],
  ])("maps %s percent change to %s", (change, expected) => {
    expect(dashboardTrendRailMagnitudeClass(change)).toBe(expected);
  });
});
