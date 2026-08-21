import { describe, expect, it } from "vitest";
import { AUREN_PUBLIC_CONTEXT, getAurenPublicContext } from "./public-context";

describe("Auren public context", () => {
  it("contains only the reviewed DailyGear source and explicit source gaps", () => {
    const dailyGear = AUREN_PUBLIC_CONTEXT.find((item) => item.business === "DailyGear");
    const missingSources = AUREN_PUBLIC_CONTEXT.filter((item) => item.status === "source_missing");

    expect(dailyGear).toMatchObject({
      sourceUrl: "https://dailygear.co.ke/",
      status: "verified_brand_context",
      confidence: "high",
    });
    expect(missingSources.map((item) => item.business)).toEqual(["Car-Bar Motion.ke", "Novera"]);
  });

  it("keeps external context separate from operational metrics", () => {
    for (const item of AUREN_PUBLIC_CONTEXT) {
      expect(item).not.toHaveProperty("revenue");
      expect(item).not.toHaveProperty("stock");
      expect(item).not.toHaveProperty("orders");
      expect(item).not.toHaveProperty("price");
      expect(item.limitations.length).toBeGreaterThan(0);
    }
  });

  it("does not expose business context in personal scope", () => {
    expect(getAurenPublicContext("personal")).toEqual([]);
    expect(getAurenPublicContext("businesses")).toHaveLength(3);
    expect(getAurenPublicContext("portfolio")).toHaveLength(3);
  });
});
