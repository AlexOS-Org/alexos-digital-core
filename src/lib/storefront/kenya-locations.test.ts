import { describe, expect, it } from "vitest";
import { buildGuestOrderRpcItems, validateGuestOrder } from "@/lib/storefront/checkout.server";
import { KENYA_COUNTIES, townsForCounty } from "@/lib/storefront/kenya-locations";

describe("Kenya-first DailyGear locations", () => {
  it("contains all 47 counties with stable unique slugs", () => {
    expect(KENYA_COUNTIES).toHaveLength(47);
    expect(new Set(KENYA_COUNTIES.map((county) => county.slug)).size).toBe(47);
  });

  it("returns towns only for the selected county", () => {
    expect(townsForCounty("nairobi")).toContain("Westlands");
    expect(townsForCounty("nairobi")).toContain("Imara Daima Estate");
    expect(townsForCounty("mombasa")).toContain("Mombasa");
    expect(townsForCounty("kiambu")).toContain("Thika");
    expect(townsForCounty("mombasa")).not.toContain("Thika");
    expect(townsForCounty("unknown-county")).toEqual([]);
  });

  it("requires Kenya, county and town at the shared checkout boundary", () => {
    expect(() =>
      validateGuestOrder({
        firstName: "Alex",
        phone: "0712345678",
        address: "Westlands",
        country: "Uganda",
        county: "",
        town: "",
        items: [{ productId: "product-1", quantity: 1 }],
        storeSlug: "dailygear",
      }),
    ).toThrow("Kenya");

    const valid = validateGuestOrder({
      firstName: "Alex",
      phone: "0712345678",
      address: "House 4",
      country: "Kenya",
      county: "Nairobi",
      town: "Nairobi",
      deliveryDetails: "Near the main gate",
      items: [{ productId: "product-1", quantity: 1 }],
      storeSlug: "dailygear",
    });

    expect(valid.country).toBe("Kenya");
    expect(valid.county).toBe("Nairobi");
    expect(valid.town).toBe("Nairobi");
    expect(valid.deliveryDetails).toBe("Near the main gate");

    const manualTown = validateGuestOrder({
      firstName: "Alex",
      phone: "0712345678",
      address: "House 4",
      country: "Kenya",
      county: "Nairobi",
      town: "New Estate Area",
      items: [{ productId: "product-1", quantity: 1 }],
      storeSlug: "dailygear",
    });
    expect(manualTown.town).toBe("New Estate Area");
  });

  it("maps browser cart lines to the database RPC contract", () => {
    expect(
      buildGuestOrderRpcItems([
        {
          productId: "product-1",
          variantId: "variant-1",
          quantity: 2,
          offerRole: "order_bump",
          funnelStepId: "step-1",
        },
      ]),
    ).toEqual([
      {
        product_id: "product-1",
        variant_id: "variant-1",
        quantity: 2,
        offer_role: "order_bump",
        funnel_step_id: "step-1",
      },
    ]);
  });
});
