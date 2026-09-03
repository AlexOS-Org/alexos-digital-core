import { bench, describe } from "vitest";
import { dashboardTrendRailMagnitudeClass } from "./DashboardTrendRail.utils";

const simulatedChanges = Array.from({ length: 100_000 }, (_, index) => {
  const signedMagnitude = (index * 37) % 201;
  return index % 2 === 0 ? signedMagnitude : -signedMagnitude;
});

describe("DashboardTrendRail high-volume preparation", () => {
  bench("classifies 100,000 KPI updates", () => {
    let checksum = 0;
    for (const change of simulatedChanges) {
      checksum += dashboardTrendRailMagnitudeClass(change).length;
    }
    if (checksum === 0) throw new Error("benchmark checksum was empty");
  });
});
