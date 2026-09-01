import { describe, expect, it } from "vitest";
import { assertNoZeroPricedLines } from "./checkout.server";

describe("assertNoZeroPricedLines", () => {
  const line = (variantId: string | null = null) => ({
    productId: "product-id",
    variantId,
    quantity: 1,
  });

  it("accepts resolved positive selling prices", () => {
    expect(() =>
      assertNoZeroPricedLines([{ productId: "p1", variantId: null, quantity: 1 }], { p1: 1_200 }),
    ).not.toThrow();
  });

  it("rejects a KES 0 product line before an order can be placed", () => {
    expect(() =>
      assertNoZeroPricedLines([{ productId: "p1", variantId: null, quantity: 1 }], { p1: 0 }),
    ).toThrow(/not priced for sale/);
  });

  it("rejects an unset/unknown price and fails closed", () => {
    expect(() =>
      assertNoZeroPricedLines([{ productId: "p1", variantId: null, quantity: 1 }], { p1: null }),
    ).toThrow(/not priced for sale/);
    expect(() =>
      assertNoZeroPricedLines([{ productId: "p1", variantId: null, quantity: 1 }], {}),
    ).toThrow(/not priced for sale/);
  });

  it("checks variant-specific price before falling back to product price", () => {
    expect(() => assertNoZeroPricedLines([line("v1")], { v1: 0, "product-id": 1_200 })).toThrow(
      /not priced for sale/,
    );

    expect(() => assertNoZeroPricedLines([line("v1")], { v1: 950 })).not.toThrow();
  });
});
