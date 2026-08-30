import { describe, expect, it } from "vitest";
import { businessSlugFromName } from "./api";

describe("business creation helpers", () => {
  it("creates a stable URL-safe slug from a business name", () => {
    expect(businessSlugFromName("  Novera School Supplies  ")).toBe("novera-school-supplies");
  });
});
