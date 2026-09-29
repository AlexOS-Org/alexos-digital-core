import { describe, expect, it } from "vitest";
import { resolveMoneyCenterScope, type MoneyCenterScope } from "./scope";
import type { Business } from "@/lib/businesses/types";

const personalBusiness = null;
const business = { id: "biz_123", slug: "dailygear", name: "DailyGear" } as Business;

describe("resolveMoneyCenterScope", () => {
  it("returns portfolio scope when no business is active", () => {
    const scope = resolveMoneyCenterScope(personalBusiness);
    expect(scope.businessId).toBeNull();
    expect(scope.isBusinessScoped).toBe(false);
    expect(scope.business).toBeNull();
  });

  it("returns portfolio scope when business is explicitly null", () => {
    const scope = resolveMoneyCenterScope(null);
    expect(scope).toEqual({
      businessId: null,
      isBusinessScoped: false,
      business: null,
    } satisfies MoneyCenterScope);
  });

  it("returns scoped values when a business is active", () => {
    const scope = resolveMoneyCenterScope(business);
    expect(scope.businessId).toBe("biz_123");
    expect(scope.isBusinessScoped).toBe(true);
    expect(scope.business).toBe(business);
  });

  it("never treats undefined businessId as 'all businesses'", () => {
    // A null businessId must mean portfolio (no filter), NOT all-businesses.
    const scope = resolveMoneyCenterScope(null);
    expect(scope.businessId).toBeNull();
    expect(scope.isBusinessScoped).toBe(false);
  });
});
