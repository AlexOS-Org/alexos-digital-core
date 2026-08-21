import { describe, expect, it } from "vitest";
import {
  defaultFunnelLandingContent,
  improvedFunnelLandingContent,
  parseFunnelLandingContent,
  serializeFunnelLandingContent,
} from "./funnel-copy";

describe("DailyGear funnel landing copy", () => {
  it("creates evidence-safe backpack defaults from the canonical product name", () => {
    const content = defaultFunnelLandingContent("Golden Wolf Laptop and Travel Backpack");

    expect(content.headline).toBe("Carry the day with less compromise.");
    expect(content.subheadline).toContain("Golden Wolf Laptop and Travel Backpack");
    expect(content.benefits).toHaveLength(4);
    expect(content.ctaLabel).toBe("Choose this bag");
  });

  it("builds product-specific AIDA copy from canonical SEO fields", () => {
    const content = improvedFunnelLandingContent({
      name: "Children School Backpack — Blue",
      sku: "DG-BAG-BLUE",
      description: "A school backpack with the verified catalogue details shown before checkout.",
      short_description: "School backpack for everyday use.",
      seo_description: "Children School Backpack in Kenya with verified size and colour details.",
    });

    expect(content.headline).toContain("Children School Backpack");
    expect(content.subheadline).toContain("verified size and colour details");
    expect(content.benefits).toHaveLength(4);
    expect(content.proof).toContain("SKU DG-BAG-BLUE");
    expect(content.ctaLabel).toBe("Review and order");
  });

  it("round-trips saved content and falls back when the stored body is invalid", () => {
    const original = defaultFunnelLandingContent("DailyGear laptop backpack");
    const parsed = parseFunnelLandingContent(
      serializeFunnelLandingContent(original),
      "Other product",
    );

    expect(parsed).toEqual(original);
    expect(parseFunnelLandingContent("not-json", "Other product").headline).toBe("Other product");
  });

  it("bounds untrusted stored fields instead of rendering arbitrary objects", () => {
    const parsed = parseFunnelLandingContent(
      JSON.stringify({
        headline: "  Short headline  ",
        benefits: [{ title: "Keep it clear", body: "Use the verified details." }],
        proof: ["One path", 4, null],
      }),
      "DailyGear bag",
    );

    expect(parsed.headline).toBe("Short headline");
    expect(parsed.benefits).toEqual([
      { title: "Keep it clear", body: "Use the verified details." },
    ]);
    expect(parsed.proof).toEqual(["One path"]);
  });
});
