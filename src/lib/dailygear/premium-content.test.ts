import { describe, expect, it } from "vitest";
import {
  buildPremiumAttributes,
  parsePremiumContentLines,
  type PremiumContentDraft,
} from "./premium-content";

const draft: PremiumContentDraft = {
  enabled: true,
  hero: "/assets/yj-baby-hero-classroom.webp",
  images: "/assets/yj-baby-feature-comfort-straps.webp\n/assets/yj-baby-feature-compartments.webp",
  featureImages: "/assets/yj-baby-feature-zipper-detail.webp",
  lifestyleImages: "/assets/yj-baby-trust-schoolday.webp",
  benefits: "Padded support|Cushioned back panel\nWater resistant|Protects books from light rain",
  features: "Organised compartments|Three separate carry sections",
  specs: "Material|Oxford fabric\nSize|Large",
  faq: "Is it machine washable?|Hand wash recommended",
};

describe("parsePremiumContentLines", () => {
  it("parses pipe-delimited content rows into structured entries", () => {
    expect(parsePremiumContentLines(draft.benefits)).toEqual([
      { title: "Padded support", description: "Cushioned back panel" },
      { title: "Water resistant", description: "Protects books from light rain" },
    ]);
    expect(parsePremiumContentLines("Organised compartments|Three sections")).toEqual([
      { title: "Organised compartments", description: "Three sections" },
    ]);
  });

  it("ignores malformed lines rather than inventing content", () => {
    expect(parsePremiumContentLines("no-pipe-here\n")).toEqual([]);
    expect(parsePremiumContentLines("")).toEqual([]);
  });
});

describe("buildPremiumAttributes", () => {
  it("merges premium config without destroying existing attributes", () => {
    const result = buildPremiumAttributes({ existing: "kept", premium: { enabled: false } }, draft);

    expect(result.existing).toBe("kept");
    expect(result.premium).toEqual({
      enabled: true,
      hero: "/assets/yj-baby-hero-classroom.webp",
      images: [
        "/assets/yj-baby-feature-comfort-straps.webp",
        "/assets/yj-baby-feature-compartments.webp",
      ],
      featureImages: ["/assets/yj-baby-feature-zipper-detail.webp"],
      lifestyleImages: ["/assets/yj-baby-trust-schoolday.webp"],
      benefits: [
        { title: "Padded support", description: "Cushioned back panel" },
        { title: "Water resistant", description: "Protects books from light rain" },
      ],
      features: [{ title: "Organised compartments", description: "Three separate carry sections" }],
      specs: [
        { label: "Material", value: "Oxford fabric" },
        { label: "Size", value: "Large" },
      ],
      faq: [{ question: "Is it machine washable?", answer: "Hand wash recommended" }],
    });
  });
});
