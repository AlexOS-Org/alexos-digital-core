import { describe, expect, it } from "vitest";
import { getProductReadiness } from "./types";

const product = {
  stock_quantity: 15,
  availability_confirmed: true,
  status: "active" as const,
  category_id: "category-id",
};

describe("getProductReadiness", () => {
  it("requires a category and verified evidence before publication", () => {
    expect(getProductReadiness({ ...product, category_id: null }, 1).readyToPublish).toBe(false);
    expect(getProductReadiness(product, 0).readyToPublish).toBe(false);
    expect(getProductReadiness(product, 1).readyToPublish).toBe(true);
  });

  it("does not block publication when informational stock is below 15 units", () => {
    const readiness = getProductReadiness({ ...product, stock_quantity: 1 }, 1);
    expect(readiness.hasMinimumStock).toBe(true);
    expect(readiness.hasConfirmedAvailability).toBe(true);
    expect(readiness.available).toBe(true);
    expect(readiness.readyToPublish).toBe(true);
  });

  it("uses explicit Out of stock status to control sellability", () => {
    const readiness = getProductReadiness({ ...product, status: "out_of_stock" }, 1);
    expect(readiness.available).toBe(false);
    expect(readiness.readyToPublish).toBe(true);
  });
});
