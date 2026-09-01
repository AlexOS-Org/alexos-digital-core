import { describe, expect, it } from "vitest";
import {
  getPremiumConfig,
  getPremiumVisualPlan,
  isPremiumProduct,
  premiumVariantImage,
} from "./premium";
import type { StoreProduct, StoreVariant } from "./api";

const product = (overrides: Partial<StoreProduct> = {}): StoreProduct =>
  ({
    id: "p1",
    user_id: "u1",
    name: "YJ School Bag",
    slug: "yj-school-bag",
    description: "A durable children's school backpack.",
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
    images: ["/assets/yj-baby-hero-classroom.webp", "/assets/yj-baby-feature-comfort-straps.webp"],
    tags: [],
    attributes: {},
    sku: "DG-YJ",
    created_at: "2026-08-01T00:00:00Z",
    ...overrides,
  }) as unknown as StoreProduct;

const variant: StoreVariant = {
  id: "v1",
  product_id: "p1",
  user_id: "u1",
  name: "Red",
  sku: "DG-YJ-RED",
  price: 2_500,
  sale_price: null,
  cost_price: 1_000,
  stock_quantity: 15,
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
} as unknown as StoreVariant;

describe("premium product configuration", () => {
  it("is disabled unless the owner has explicitly enabled premium", () => {
    expect(isPremiumProduct(product())).toBe(false);
    expect(isPremiumProduct(product({ attributes: { premium: { enabled: false } } }))).toBe(false);
    expect(isPremiumProduct(product({ attributes: { premium: { enabled: true } } }))).toBe(true);
  });

  it("does not enable premium from unrelated attribute objects", () => {
    expect(isPremiumProduct(product({ attributes: { colour: { enabled: true } } }))).toBe(false);
    expect(isPremiumProduct(product({ attributes: "bad" }))).toBe(false);
  });
});

describe("getPremiumConfig", () => {
  it("parses owner-stored premium content only", () => {
    const config = getPremiumConfig(
      product({
        attributes: {
          premium: {
            enabled: true,
            hero: "/assets/yj-baby-hero-classroom.webp",
            images: ["/assets/yj-baby-feature-comfort-straps.webp"],
            benefits: [{ title: "Padded support", description: "Cushioned back panel." }],
          },
        },
      }),
    );

    expect(config.enabled).toBe(true);
    expect(config.hero).toBe("/assets/yj-baby-hero-classroom.webp");
    expect(config.images).toEqual(["/assets/yj-baby-feature-comfort-straps.webp"]);
    expect(config.benefits).toEqual([
      { title: "Padded support", description: "Cushioned back panel." },
    ]);
    expect(config.faq).toEqual([]);
  });

  it("returns disabled config when premium is absent", () => {
    expect(getPremiumConfig(product()).enabled).toBe(false);
  });
});

describe("getPremiumVisualPlan", () => {
  it("uses the stored product gallery when no premium gallery is configured", () => {
    const plan = getPremiumVisualPlan(product(), [variant]);
    expect(plan.gallery).toEqual(product().images);
    expect(plan.hero).toBe(product().images?.[0]);
  });

  it("prefers explicit premium images and does not invent visuals", () => {
    const plan = getPremiumVisualPlan(
      product({
        attributes: {
          premium: {
            enabled: true,
            hero: "/assets/yj-baby-hero-classroom.webp",
            images: ["/assets/yj-baby-feature-comfort-straps.webp"],
            featureImages: ["/assets/yj-baby-feature-compartments.webp"],
          },
        },
      }),
      [variant],
    );

    expect(plan.hero).toBe("/assets/yj-baby-hero-classroom.webp");
    expect(plan.gallery).toEqual(["/assets/yj-baby-feature-comfort-straps.webp"]);
    expect(plan.featureImages).toEqual(["/assets/yj-baby-feature-compartments.webp"]);
  });
});

describe("premiumVariantImage", () => {
  it("maps a variant to its stored image when present", () => {
    expect(
      premiumVariantImage(product(), {
        ...variant,
        image_url: "/assets/yj-baby-navy-pink-trim-exact.jpg",
      }),
    ).toBe("/assets/yj-baby-navy-pink-trim-exact.jpg");
  });

  it("falls back to the known accurate colour card without inventing an image", () => {
    const image = premiumVariantImage(product(), {
      ...variant,
      name: "Green",
      color: "Teal/Green",
    });
    expect(image).toContain("lqYSLmnstKCbhSqy.png");
  });
});
