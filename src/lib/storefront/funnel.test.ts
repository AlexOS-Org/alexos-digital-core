import { describe, expect, it } from "vitest";
import { validateFunnelSlug } from "./funnel.server";
import { validateGuestOrder } from "./checkout.server";

describe("native DailyGear funnel validation", () => {
  it("normalizes a public slug without accepting path syntax", () => {
    expect(validateFunnelSlug({ slug: "  150W-Car-Inverter  " })).toEqual({
      slug: "150w-car-inverter",
    });
    expect(() => validateFunnelSlug({ slug: "../private" })).toThrow(
      "This sales experience could not be found.",
    );
  });

  it("requires funnel context for non-primary offer lines", () => {
    const input = {
      storeSlug: "dailygear",
      firstName: "Alex",
      email: "alex@example.com",
      phone: "0712345678",
      address: "Nairobi",
      country: "Kenya",
      county: "Nairobi",
      town: "Nairobi",
      paymentMethod: "cod",
      items: [
        {
          productId: "8d7f0b1c-1f51-4d40-9de2-8b0c8b6e3b0d",
          quantity: 1,
          offerRole: "order_bump",
          funnelStepId: "8d7f0b1c-1f51-4d40-9de2-8b0c8b6e3b0d",
        },
      ],
    };

    expect(() => validateGuestOrder(input)).toThrow(
      "Offer context is missing. Please reopen the campaign page.",
    );

    expect(
      validateGuestOrder({
        ...input,
        funnelId: "8d7f0b1c-1f51-4d40-9de2-8b0c8b6e3b0d",
      }).items[0],
    ).toMatchObject({ offerRole: "order_bump", funnelStepId: expect.any(String) });
  });
});
