import { describe, expect, it } from "vitest";
import {
  CATALOGUE_FILTER_OPTIONS,
  matchesCatalogueFilter,
  type CatalogueFilterContext,
} from "./catalogue-filters";

const base: CatalogueFilterContext = {
  status: "draft",
  price: 0,
  stock: 0,
  lowStock: false,
  premium: false,
  hasFunnel: false,
  catalogueReady: true,
  salesReady: false,
  missingPrice: true,
};

describe("matchesCatalogueFilter", () => {
  it("all matches every row", () => {
    expect(matchesCatalogueFilter(base, "all")).toBe(true);
  });

  it("filters by status, price, stock and premium state", () => {
    expect(matchesCatalogueFilter({ ...base, status: "active" }, "published")).toBe(true);
    expect(matchesCatalogueFilter(base, "draft")).toBe(true);
    expect(matchesCatalogueFilter(base, "zero_price")).toBe(true);
    expect(
      matchesCatalogueFilter({ ...base, price: 2500, missingPrice: false }, "zero_price"),
    ).toBe(false);
    expect(matchesCatalogueFilter({ ...base, premium: true }, "premium")).toBe(true);
    expect(matchesCatalogueFilter({ ...base, stock: 3, lowStock: true }, "low_stock")).toBe(true);
    expect(matchesCatalogueFilter({ ...base, stock: 0 }, "out_of_stock")).toBe(true);
  });

  it("filters by readiness and funnel relationship", () => {
    expect(matchesCatalogueFilter({ ...base, salesReady: true }, "sales_ready")).toBe(true);
    expect(matchesCatalogueFilter(base, "not_ready")).toBe(true);
    expect(matchesCatalogueFilter({ ...base, hasFunnel: true }, "funnel_connected")).toBe(true);
    expect(matchesCatalogueFilter({ ...base, hasFunnel: false }, "funnel_missing")).toBe(true);
  });

  it("lists every required filter option once", () => {
    const keys = CATALOGUE_FILTER_OPTIONS.map((option) => option.value);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys).toEqual(
      expect.arrayContaining([
        "all",
        "draft",
        "published",
        "catalogue_ready",
        "sales_ready",
        "not_ready",
        "zero_price",
        "premium",
        "low_stock",
        "out_of_stock",
        "funnel_connected",
        "funnel_missing",
      ]),
    );
  });
});
