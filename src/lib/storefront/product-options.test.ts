import { describe, expect, it } from "vitest";
import {
  areAllUnavailable,
  findVariantForOptions,
  getOptionGroups,
  getVariantOption,
  isVariantUnavailable,
} from "./product-options";
import type { StoreVariant } from "./api";

const variant = (overrides: Partial<StoreVariant> = {}): StoreVariant =>
  ({
    id: "v1",
    product_id: "p1",
    user_id: "u1",
    name: "Red",
    sku: "DG-RED",
    price: 2_000,
    sale_price: null,
    cost_price: 1_000,
    stock_quantity: 10,
    options: { color: "Red", sex: "Unisex" },
    color: "Red",
    image_url: "",
    availability_confirmed: true,
    sort_order: 0,
    tags: [],
    images: [],
    deleted_at: null,
    created_at: "2026-08-01T00:00:00Z",
    updated_at: "2026-08-01T00:00:00Z",
    ...overrides,
  }) as StoreVariant;

describe("product variant options", () => {
  const variants = [
    variant({ id: "v1", name: "Red", color: "Red", options: { color: "Red", sex: "Unisex" } }),
    variant({
      id: "v2",
      name: "Green",
      color: "Teal/Green",
      options: { color: "Teal/Green", sex: "Unisex" },
    }),
  ];

  it("reads colour and gender from the canonical field or options bag", () => {
    expect(getVariantOption(variants[0], "color")).toBe("Red");
    expect(getVariantOption(variants[0], "gender")).toBe("Unisex");
  });

  it("builds option groups in a stable order", () => {
    const groups = getOptionGroups(variants);
    expect(groups).toEqual([
      { key: "gender", values: ["Unisex"] },
      { key: "color", values: ["Red", "Teal/Green"] },
    ]);
  });

  it("finds the matching variant for the selected options", () => {
    expect(findVariantForOptions(variants, { color: "Red", gender: "Unisex" })?.id).toBe("v1");
    expect(findVariantForOptions(variants, { color: "Teal/Green", gender: "Unisex" })?.id).toBe(
      "v2",
    );
  });

  it("flags unavailable options without conflating them with a sold-out fleet", () => {
    const partial = [
      variant({ id: "v1", name: "Red", color: "Red", availability_confirmed: false }),
      variant({ id: "v2", name: "Green", color: "Teal/Green", availability_confirmed: true }),
    ];
    expect(isVariantUnavailable(partial, {}, "color", "Red")).toBe(true);
    expect(isVariantUnavailable(partial, {}, "color", "Teal/Green")).toBe(false);
    expect(areAllUnavailable(partial)).toBe(false);
  });
});
