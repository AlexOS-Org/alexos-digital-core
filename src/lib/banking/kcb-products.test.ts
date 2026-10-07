import { describe, expect, it } from "vitest";
import { KCB_PRODUCT_OPTIONS, productOptionsForKpi } from "./kcb-products";

describe("KCB product catalog", () => {
  it("includes the named card products from the performance letter", () => {
    expect(KCB_PRODUCT_OPTIONS.CREDIT_CARDS).toEqual(
      expect.arrayContaining([
        "Classic Card",
        "Gold Card",
        "Platinum Card",
        "School / College Prepaid Card",
      ]),
    );
  });

  it("returns products for each contractual KPI and a safe fallback", () => {
    expect(productOptionsForKpi("LOANS")).toContain("Personal Loan");
    expect(productOptionsForKpi("VOOMA")).toEqual(["Vooma Merchant", "Vooma Agent"]);
    expect(productOptionsForKpi("UNKNOWN")).toEqual(["Other product"]);
  });
});
