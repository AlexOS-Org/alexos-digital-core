import { describe, expect, it } from "vitest";
import { validateGuestOrder } from "@/lib/storefront/checkout.server";
import { KENYA_COUNTIES, townsForCounty } from "@/lib/storefront/kenya-locations";

describe("Kenya-first DailyGear locations", () => {
  it("contains all 47 counties with stable unique slugs", () => {
    expect(KENYA_COUNTIES).toHaveLength(47);
    expect(new Set(KENYA_COUNTIES.map((county) => county.slug)).size).toBe(47);
  });

  it("returns towns only for the selected county", () => {
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
  });
});
