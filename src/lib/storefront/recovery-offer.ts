export type RecoveryOffer =
  | { kind: "none"; reason: "missing_verified_costs" | "below_profit_floor" }
  | { kind: "free_delivery"; amount: number; projectedProfit: number; projectedMarginPct: number }
  | { kind: "discount"; amount: number; projectedProfit: number; projectedMarginPct: number };

export interface RecoveryOfferInput {
  subtotal: number;
  deliveryCharge: number;
  verifiedCostOfGoods: number | null;
  verifiedDeliveryCost: number | null;
  minimumMarginPct: number;
  discountAmount?: number;
}

/**
 * Offers are intentionally fail-closed. A missing or unverified cost never
 * produces a discount recommendation, preventing a false profit signal.
 */
export function calculateRecoveryOffer(input: RecoveryOfferInput): RecoveryOffer {
  const subtotal = Math.max(0, input.subtotal);
  const deliveryCharge = Math.max(0, input.deliveryCharge);
  const costOfGoods = input.verifiedCostOfGoods;
  const deliveryCost = input.verifiedDeliveryCost;
  const minimumMarginPct = Math.max(0, input.minimumMarginPct);
  if (costOfGoods == null || deliveryCost == null || subtotal <= 0) {
    return { kind: "none", reason: "missing_verified_costs" };
  }

  const floor = subtotal * (minimumMarginPct / 100);
  const baseProfit = subtotal + deliveryCharge - costOfGoods - deliveryCost;
  const freeDeliveryProfit = subtotal - costOfGoods - deliveryCost;
  if (freeDeliveryProfit >= floor) {
    return {
      kind: "free_delivery",
      amount: deliveryCharge,
      projectedProfit: freeDeliveryProfit,
      projectedMarginPct: (freeDeliveryProfit / subtotal) * 100,
    };
  }

  const discountAmount = Math.min(Math.max(0, input.discountAmount ?? 0), subtotal);
  const discountedProfit = baseProfit - discountAmount;
  if (discountAmount > 0 && discountedProfit >= floor) {
    return {
      kind: "discount",
      amount: discountAmount,
      projectedProfit: discountedProfit,
      projectedMarginPct: (discountedProfit / subtotal) * 100,
    };
  }
  return { kind: "none", reason: "below_profit_floor" };
}
