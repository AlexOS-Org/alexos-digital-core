import { describe, expect, it } from "vitest";
import { planBulkPublish, type BulkPublishCandidate } from "./bulk-actions";

const eligibleInput = {
  hasName: true,
  hasCategory: true,
  hasConfirmedAvailability: true,
  hasEvidence: true,
  hasVariantReadiness: true,
  hasValidImageUrls: true,
  hasSellablePrice: false,
};

const candidate = (
  id: string,
  overrides: Partial<typeof eligibleInput> = {},
): BulkPublishCandidate => ({
  id,
  input: { ...eligibleInput, ...overrides },
});

describe("planBulkPublish", () => {
  it("publishes only candidates that satisfy catalogue readiness", () => {
    const plan = planBulkPublish([candidate("a"), candidate("b", { hasName: false })]);

    expect(plan.eligible.map((item) => item.id)).toEqual(["a"]);
    expect(plan.skipped).toEqual([
      { id: "b", blockers: expect.arrayContaining(["a product name"]) },
    ]);
  });

  it("does not treat a missing price as a catalogue blocker", () => {
    const plan = planBulkPublish([candidate("a", { hasSellablePrice: false })]);

    expect(plan.eligible.map((item) => item.id)).toEqual(["a"]);
    expect(plan.skipped).toEqual([]);
  });

  it("skips candidates without a primary image or confirmed availability", () => {
    const plan = planBulkPublish([
      candidate("a", { hasValidImageUrls: false }),
      candidate("b", { hasConfirmedAvailability: false }),
    ]);

    expect(plan.eligible).toEqual([]);
    expect(plan.skipped.map((item) => item.id).sort()).toEqual(["a", "b"]);
  });
});
