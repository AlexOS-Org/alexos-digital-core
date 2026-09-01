import { describe, expect, it } from "vitest";
import { buildVariantCommercialPayload } from "./variant-commercial";

const draft = {
  color: "Blue",
  sex: "Boy",
  imageUrl: "https://source.example/blue.jpg",
  sku: "DG-YJ-BLU",
  stock: "15",
  price: "2400",
  salePrice: "2200",
  costPrice: "1100",
  available: true,
};

describe("buildVariantCommercialPayload", () => {
  it("maps variant commercial fields into the save payload", () => {
    const payload = buildVariantCommercialPayload("v1", draft);

    expect(payload.id).toBe("v1");
    expect(payload.price).toBe(2_400);
    expect(payload.sale_price).toBe(2_200);
    expect(payload.cost_price).toBe(1_100);
    expect(payload.stock_quantity).toBe(15);
    expect(payload.availability_confirmed).toBe(true);
  });

  it("leaves blank commercial fields as null so the product value is used", () => {
    const payload = buildVariantCommercialPayload("v1", {
      ...draft,
      price: "",
      salePrice: "",
      costPrice: "",
    });

    expect(payload.price).toBeNull();
    expect(payload.sale_price).toBeNull();
    expect(payload.cost_price).toBeNull();
  });

  it("preserves existing option keys", () => {
    const payload = buildVariantCommercialPayload("v1", draft, { size: "L" });

    expect(payload.options).toEqual({ size: "L", color: "Blue", sex: "Boy" });
  });

  it("ignores non-finite numeric input", () => {
    const payload = buildVariantCommercialPayload("v1", {
      ...draft,
      price: "not-a-number",
      salePrice: "NaN",
      costPrice: "Infinity",
    });

    expect(payload.price).toBeNull();
    expect(payload.sale_price).toBeNull();
    expect(payload.cost_price).toBeNull();
  });
});
