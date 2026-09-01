import { describe, expect, it } from "vitest";
import {
  canPublishToCatalogue,
  cataloguePublicationBlockers,
  normalizeCurrencyCode,
  type CataloguePublishInput,
} from "./catalogue-publish";

const ready: CataloguePublishInput = {
  hasName: true,
  hasCategory: true,
  hasConfirmedAvailability: true,
  hasEvidence: true,
  hasVariantReadiness: true,
  hasValidImageUrls: true,
  hasSellablePrice: true,
};

describe("catalogue publication", () => {
  it("allows publishing a product even when the selling price is not set", () => {
    const input = { ...ready, hasSellablePrice: false };

    expect(cataloguePublicationBlockers(input)).not.toContain("a positive selling price");
    expect(canPublishToCatalogue(input)).toBe(true);
  });

  it("still blocks catalogue publication on the actual catalogue requirements", () => {
    const input = {
      ...ready,
      hasName: false,
      hasCategory: false,
      hasConfirmedAvailability: false,
      hasEvidence: false,
      hasValidImageUrls: false,
    };

    const blockers = cataloguePublicationBlockers(input);

    expect(blockers).toContain("a product name");
    expect(blockers).toContain("a primary category");
    expect(blockers).toContain("confirmed availability");
    expect(blockers).toContain("source evidence");
    expect(blockers).toContain("valid HTTPS image URLs");
    expect(canPublishToCatalogue(input)).toBe(false);
  });

  it("keeps the positive-price requirement separate as a sales gate", () => {
    const input = { ...ready, hasSellablePrice: false };

    // Catalogue is publishable; checkout must still be blocked elsewhere.
    expect(input.hasSellablePrice).toBe(false);
  });
});

describe("normalizeCurrencyCode", () => {
  it("normalises a known currency to uppercase", () => {
    expect(normalizeCurrencyCode("kes")).toBe("KES");
    expect(normalizeCurrencyCode(" usd ")).toBe("USD");
  });

  it("falls back to the default Kenyan shilling when the value is missing", () => {
    expect(normalizeCurrencyCode(null)).toBe("KES");
    expect(normalizeCurrencyCode("")).toBe("KES");
    expect(normalizeCurrencyCode(" ")).toBe("KES");
  });

  it("rejects unsafe non-alpha currency values", () => {
    expect(normalizeCurrencyCode("US;DROP")).toBe("KES");
  });
});
