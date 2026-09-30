import { describe, expect, it } from "vitest";
import { buildResourceInsertPayload } from "./api";

describe("buildResourceInsertPayload — business_id on DailyGear create", () => {
  it("attaches business_id when a business is in scope", () => {
    const payload = buildResourceInsertPayload({ name: "Widget" }, "user-1", "biz-1", null);
    expect(payload.user_id).toBe("user-1");
    expect(payload.name).toBe("Widget");
    expect(payload.business_id).toBe("biz-1");
  });

  it("omits business_id when no business is in scope (portfolio view)", () => {
    const payload = buildResourceInsertPayload({ name: "Widget" }, "user-1", null, null);
    expect(payload.user_id).toBe("user-1");
    expect(payload).not.toHaveProperty("business_id");
  });

  it("prefers the per-call businessId over the factory default", () => {
    const payload = buildResourceInsertPayload({ name: "Widget" }, "user-1", "biz-2", "biz-1");
    expect(payload.business_id).toBe("biz-2");
  });

  it("falls back to the factory default when per-call businessId is null", () => {
    const payload = buildResourceInsertPayload({ name: "Widget" }, "user-1", null, "biz-1");
    expect(payload.business_id).toBe("biz-1");
  });
});
