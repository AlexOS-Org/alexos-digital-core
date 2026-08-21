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

  it("keeps the minimum stock rule independent from ordinary availability", () => {
    const readiness = getProductReadiness({ ...product, stock_quantity: 14 }, 1);
    expect(readiness.hasMinimumStock).toBe(false);
    expect(readiness.hasConfirmedAvailability).toBe(true);
    expect(readiness.readyToPublish).toBe(false);
  });
});
