import { describe, expect, it } from "vitest";
import { productReadinessSignals } from "./product-readiness-signals";
import type { Product } from "./types";

const product = (overrides: Partial<Product> = {}): Product =>
  ({
    id: "p1",
    user_id: "u1",
    name: "YJ School Bag",
    slug: "yj-school-bag",
    description: "Durable children's school backpack.",
    short_description: null,
    seo_title: "YJ School Bag | DailyGear",
    seo_description: "Durable school backpack.",
    seo_keywords: [],
    image_alt_text: "YJ School Bag",
    price: 2_500,
    sale_price: null,
    cost_price: 1_000,
    currency: "KES",
    stock_quantity: 15,
    low_stock_threshold: 5,
    status: "active",
    availability_confirmed: true,
    category_id: "cat-1",
    images: ["https://source.example/product.jpg"],
    tags: [],
    attributes: {},
    sort_order: 0,
    deleted_at: null,
    created_at: "2026-08-01T00:00:00Z",
    updated_at: "2026-08-01T00:00:00Z",
    ...overrides,
  }) as Product;

const ctx = { products: [product({})], orders: [], orderItems: [], customers: [], currency: "KES" };

describe("productReadinessSignals", () => {
  it("surfaces a FACT when a product has no selling price", () => {
    const signals = productReadinessSignals({ ...ctx, products: [product({ price: 0 })] });

    const signal = signals.find((s) => s.id === "readiness-price-missing-p1");
    expect(signal).toBeDefined();
    expect(signal?.kind).toBe("market");
    expect(signal?.tone).toBe("warning");
    expect(signal?.title).toContain("YJ School Bag");
    expect(signal?.summary).toContain("no positive selling price");
    expect(signal?.recommendation).toContain("positive selling price");
  });

  it("separates fact from recommendation and does not mutate the product", () => {
    const signals = productReadinessSignals(ctx);
    const ready = signals.find((s) => s.id === "readiness-ok-p1");

    expect(ready?.title).toContain("sales-ready");
    expect(ready?.summary).toContain("positive selling price");
    expect(ready?.source).toContain("Internal catalogue");
    expect(ctx.products[0].price).toBe(2_500);
  });

  it("flags low stock without inventing sales data", () => {
    const signals = productReadinessSignals({
      ...ctx,
      products: [product({ stock_quantity: 2 })],
    });

    const signal = signals.find((s) => s.id === "readiness-low-stock-p1");
    expect(signal).toBeDefined();
    expect(signal?.tone).toBe("warning");
    expect(signal?.recommendation).toMatch(/re-order/i);
  });
});
