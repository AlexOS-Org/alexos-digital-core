import { describe, expect, it } from "vitest";
import {
  assessProductReadiness,
  canActivateForSale,
  effectiveUnitPrice,
  hasSalesPrice,
} from "./product-readiness";
import type { ProductReadinessShape } from "./product-readiness";

const base: ProductReadinessShape = {
  name: "YJ School Bag",
  description: "A durable children's school backpack.",
  seo_title: "YJ School Bag | DailyGear",
  seo_description: "Durable kids school backpack with compartments.",
  price: 2_500,
  currency: "KES",
  images: ["https://source.example/product.jpg"],
  status: "active",
  availability_confirmed: true,
  category_id: "cat-1",
  stock_quantity: 15,
  low_stock_threshold: 5,
};

describe("assessProductReadiness", () => {
  it("marks a complete active product as catalogue-ready and sales-ready", () => {
    const result = assessProductReadiness(base);

    expect(result.catalogueReady).toBe(true);
    expect(result.salesReady).toBe(true);
    expect(result.reasons).toEqual([]);
  });

  it("allows catalogue publication while a price is unset", () => {
    const result = assessProductReadiness({ ...base, price: 0 });

    expect(result.catalogueReady).toBe(true);
    expect(result.salesReady).toBe(false);
    expect(result.reasons).toContain("missing_price");
  });

  it("does not silently treat zero price as a legitimate sale price", () => {
    const result = assessProductReadiness({ ...base, price: 0 });

    expect(hasSalesPrice({ price: 0, sale_price: null })).toBe(false);
    expect(canActivateForSale({ price: 0, sale_price: null })).toBe(false);
    expect(result.salesReady).toBe(false);
  });

  it("only activates a product for sale when a positive selling price exists", () => {
    expect(canActivateForSale({ price: 1_200, sale_price: null })).toBe(true);
    expect(canActivateForSale({ price: 1_200, sale_price: 0 })).toBe(true);
    expect(canActivateForSale({ price: -100, sale_price: null })).toBe(false);
    expect(canActivateForSale({ price: Number.NaN, sale_price: null })).toBe(false);
  });

  it("blocks sales readiness when the product is not active or availability is unconfirmed", () => {
    expect(assessProductReadiness({ ...base, status: "draft" }).salesReady).toBe(false);
    expect(assessProductReadiness({ ...base, availability_confirmed: false }).salesReady).toBe(
      false,
    );
  });

  it("blocks sales readiness when stock is not configured", () => {
    const result = assessProductReadiness({ ...base, stock_quantity: null });

    expect(result.reasons).toContain("missing_stock_configuration");
    expect(result.salesReady).toBe(false);
  });

  it("still allows catalogue publication while stock is not configured", () => {
    const result = assessProductReadiness({ ...base, stock_quantity: null });

    expect(result.catalogueReady).toBe(true);
  });

  it("checks the commercial and SEO minimums", () => {
    const missing = assessProductReadiness({
      ...base,
      description: null,
      seo_title: null,
      images: [],
      currency: "KES",
    });

    expect(missing.reasons).toEqual(
      expect.arrayContaining(["missing_description", "missing_seo_title", "missing_primary_image"]),
    );
    expect(missing.catalogueReady).toBe(false);
  });
});

describe("effectiveUnitPrice", () => {
  it("uses sale price only when present, positive and lower", () => {
    expect(effectiveUnitPrice({ price: 2_400, sale_price: 2_000 })).toBe(2_000);
    expect(effectiveUnitPrice({ price: 2_400, sale_price: 3_000 })).toBe(2_400);
    expect(effectiveUnitPrice({ price: 2_400, sale_price: null })).toBe(2_400);
  });

  it("never lets a zero price, zero sale price or invalid value become a sale", () => {
    expect(effectiveUnitPrice({ price: 0, sale_price: null })).toBe(0);
    expect(effectiveUnitPrice({ price: 0, sale_price: 0 })).toBe(0);
    expect(hasSalesPrice({ price: 0, sale_price: null })).toBe(false);
    expect(hasSalesPrice({ price: 0, sale_price: 0 })).toBe(false);
  });

  it("keeps a valid base price saleable even when a zero sale value is provided", () => {
    // A sale_price of 0 must never override the positive base price.
    expect(effectiveUnitPrice({ price: 1_200, sale_price: 0 })).toBe(1_200);
    expect(hasSalesPrice({ price: 1_200, sale_price: 0 })).toBe(true);
  });
});
