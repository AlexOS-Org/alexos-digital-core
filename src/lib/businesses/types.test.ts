import { describe, expect, it } from "vitest";
import { BUSINESS_MODULE_MAP, businessTypeFromSlug, getBusinessUrlSlug } from "./types";

describe("business slug normalization", () => {
  it("normalizes DailyGear slug variants", () => {
    expect(getBusinessUrlSlug("dailygear")).toBe("dailygear");
    expect(getBusinessUrlSlug("dailygears")).toBe("dailygear");
    expect(getBusinessUrlSlug("DailyGear")).toBe("dailygear");
    expect(getBusinessUrlSlug("DAILYGEARS")).toBe("dailygear");
  });

  it("normalizes Novera slug variants", () => {
    expect(getBusinessUrlSlug("novera")).toBe("novera");
    expect(getBusinessUrlSlug("novera ")).toBe("novera");
  });

  it("passes through unknown slugs", () => {
    expect(getBusinessUrlSlug("custom-business")).toBe("custom-business");
  });
});

describe("business type resolution", () => {
  it("maps dailygear to ecommerce", () => {
    expect(businessTypeFromSlug("dailygear")).toBe("ecommerce");
    expect(businessTypeFromSlug("dailygears")).toBe("ecommerce");
  });

  it("maps carbaramotion to vehicle", () => {
    expect(businessTypeFromSlug("carbaramotion")).toBe("vehicle");
    expect(businessTypeFromSlug("carbar_motion")).toBe("vehicle");
  });

  it("maps novera to service", () => {
    expect(businessTypeFromSlug("novera")).toBe("service");
  });

  it("returns null for unknown slugs", () => {
    expect(businessTypeFromSlug("unknown")).toBeNull();
  });
});

describe("business module map", () => {
  it("contains all three known businesses", () => {
    expect(BUSINESS_MODULE_MAP.dailygear).toBe("ecommerce");
    expect(BUSINESS_MODULE_MAP.novera).toBe("service");
    expect(BUSINESS_MODULE_MAP.carbaramotion).toBe("vehicle");
  });
});
