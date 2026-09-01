import { describe, expect, it } from "vitest";
import { isOutboundMovement, validateStockMovementRequest } from "./inventory.server";

describe("validateStockMovementRequest", () => {
  it("accepts an inbound purchase with a positive quantity", () => {
    const result = validateStockMovementRequest({
      productId: "prod-1",
      type: "purchase",
      quantity: 12,
      reference: "PO-2026-001",
    });

    expect(result.productId).toBe("prod-1");
    expect(result.type).toBe("purchase");
    expect(result.quantity).toBe(12);
  });

  it("accepts an outbound damage with a negative quantity", () => {
    const result = validateStockMovementRequest({
      productId: "prod-1",
      type: "damage",
      quantity: -2,
    });

    expect(result.quantity).toBe(-2);
    expect(isOutboundMovement(result)).toBe(true);
  });

  it("rejects a zero quantity and an unknown movement type", () => {
    expect(() =>
      validateStockMovementRequest({ productId: "prod-1", type: "purchase", quantity: 0 }),
    ).toThrow();
    expect(() =>
      validateStockMovementRequest({ productId: "prod-1", type: "magic", quantity: 1 }),
    ).toThrow();
  });

  it("rejects a missing product id", () => {
    expect(() =>
      validateStockMovementRequest({ productId: "", type: "purchase", quantity: 1 }),
    ).toThrow();
  });
});
