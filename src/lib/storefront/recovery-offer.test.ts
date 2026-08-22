import { describe, expect, it } from "vitest";
import { calculateRecoveryOffer } from "./recovery-offer";

describe("DailyGear recovery offers", () => {
  it("fails closed when verified costs are missing", () => {
    expect(
      calculateRecoveryOffer({
        subtotal: 3950,
        deliveryCharge: 200,
        verifiedCostOfGoods: null,
        verifiedDeliveryCost: 100,
        minimumMarginPct: 20,
      }),
    ).toEqual({ kind: "none", reason: "missing_verified_costs" });
  });

  it("allows free delivery only when the margin floor remains protected", () => {
    const offer = calculateRecoveryOffer({
      subtotal: 3950,
      deliveryCharge: 200,
      verifiedCostOfGoods: 2600,
      verifiedDeliveryCost: 100,
      minimumMarginPct: 20,
    });
    expect(offer.kind).toBe("free_delivery");
    if (offer.kind === "free_delivery") expect(offer.projectedProfit).toBe(1250);
  });

  it("refuses a discount that would breach the floor", () => {
    expect(
      calculateRecoveryOffer({
        subtotal: 3950,
        deliveryCharge: 200,
        verifiedCostOfGoods: 3000,
        verifiedDeliveryCost: 250,
        minimumMarginPct: 20,
        discountAmount: 200,
      }),
    ).toEqual({ kind: "none", reason: "below_profit_floor" });
  });
});
