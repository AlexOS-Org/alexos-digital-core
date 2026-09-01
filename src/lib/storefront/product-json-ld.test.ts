import { describe, expect, it } from "vitest";
import { buildProductJsonLd } from "./product-json-ld";

const base = {
  id: "prod-1",
  name: "YJ School Bag",
  slug: "yj-school-bag",
  description: "Durable children's school backpack.",
  sku: "DG-YJ-001",
  image_alt_text: "YJ school bag in navy",
  images: ["https://source.example/yj-main.webp"],
  attributes: {},
  price: 2500,
  sale_price: null,
  currency: "KES",
  stock_quantity: 10,
  seo_title: "YJ School Bag | DailyGear",
  seo_description: "Durable kids school backpack.",
};

describe("buildProductJsonLd", () => {
  it("builds a Product entity with a positive offer", () => {
    const result = buildProductJsonLd(base, {
      slug: "dailygear",
      currency: "KES",
      name: "DailyGear",
    });

    expect(result?.["@type"]).toBe("Product");
    expect(result?.name).toBe("YJ School Bag");
    expect(result?.offers?.price).toBe("2500");
    expect(result?.offers?.priceCurrency).toBe("KES");
    expect(result?.offers?.availability).toBe("https://schema.org/InStock");
  });

  it("never advertises a zero or unset price as an offer", () => {
    const result = buildProductJsonLd({ ...base, price: 0, sale_price: null }, null);

    expect(result?.offers).toBeUndefined();
  });

  it("uses sale price when present, positive and lower", () => {
    const result = buildProductJsonLd({ ...base, sale_price: 2200 }, null);

    expect(result?.offers?.price).toBe("2200");
  });

  it("marks unconfigured stock as out of stock", () => {
    const result = buildProductJsonLd({ ...base, stock_quantity: null }, null);

    expect(result?.offers?.availability).toBe("https://schema.org/OutOfStock");
  });

  it("omits ratings and reviews entirely", () => {
    const result = buildProductJsonLd(base, null);

    expect(result).not.toHaveProperty("aggregateRating");
    expect(result).not.toHaveProperty("review");
  });
});
