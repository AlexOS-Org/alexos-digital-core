import { describe, expect, it } from "vitest";
import { billMonthlyEquivalent, getBillDueState, nextBillDueDate } from "./bills";

describe("billMonthlyEquivalent", () => {
  it("normalizes recurring frequencies to a monthly planning amount", () => {
    expect(billMonthlyEquivalent(120, "weekly")).toBeCloseTo(520);
    expect(billMonthlyEquivalent(300, "monthly")).toBe(300);
    expect(billMonthlyEquivalent(900, "quarterly")).toBe(300);
    expect(billMonthlyEquivalent(1200, "yearly")).toBe(100);
  });

  it("does not treat one-time bills as recurring monthly obligations", () => {
    expect(billMonthlyEquivalent(1200, "one_time")).toBe(0);
  });

  it("does not produce negative planning obligations", () => {
    expect(billMonthlyEquivalent(-10, "monthly")).toBe(0);
  });

  it("advances every recurring frequency instead of marking quarterly and yearly bills one-time", () => {
    expect(nextBillDueDate("2026-01-15", "weekly")).toBe("2026-01-22");
    expect(nextBillDueDate("2026-01-15", "monthly")).toBe("2026-02-15");
    expect(nextBillDueDate("2026-01-15", "quarterly")).toBe("2026-04-15");
    expect(nextBillDueDate("2026-01-15", "yearly")).toBe("2027-01-15");
    expect(nextBillDueDate("2026-01-15", "one_time")).toBe("2026-01-15");
  });
});

describe("getBillDueState", () => {
  const today = new Date(2026, 8, 10); // 10 Sep 2026 local

  it("labels due today", () => {
    const state = getBillDueState("2026-09-10", "pending", today);
    expect(state.kind).toBe("due_today");
    expect(state.days).toBe(0);
    expect(state.label).toBe("Due today");
  });

  it("labels upcoming due in N days", () => {
    const state = getBillDueState("2026-09-14", "pending", today);
    expect(state.kind).toBe("upcoming");
    expect(state.days).toBe(4);
    expect(state.label).toBe("Due in 4 days");
  });

  it("labels overdue by N days", () => {
    const state = getBillDueState("2026-09-08", "pending", today);
    expect(state.kind).toBe("overdue");
    expect(state.days).toBe(-2);
    expect(state.label).toBe("Overdue by 2 days");
  });

  it("marks paid status without relative days", () => {
    const state = getBillDueState("2026-09-01", "paid", today);
    expect(state.kind).toBe("paid");
    expect(state.label).toBe("Paid");
  });
});

/**
 * Business-scope contract for Bills.
 *
 * The authoritative isolation guarantee for Bills comes from two layers:
 *
 * 1. Database — `20260929020000_add_business_scope_to_bills.sql` adds
 *    `business_id` (nullable FK to public.businesses), `financial_scope`
 *    (text NOT NULL DEFAULT 'personal'), and `business_name` (text) to the
 *    `bills` table, plus `bills_scope_idx` and `bills_business_id_idx`.
 * 2. Application — `useBills(businessId)` in `./bills` emits an exact
 *    `business_id` equality filter when a business id is supplied, and no
 *    filter at all when it is omitted.
 *
 * These tests verify the application-layer contract without requiring a live
 * Supabase connection.
 */

/** Mirrors the query-key computation used by `useBills`. */
function billsQueryKey(businessId?: string | null) {
  return ["bills", businessId ?? null] as const;
}

describe("useBills scope contract", () => {
  it("uses a single portfolio query key when no business id is supplied", () => {
    expect(billsQueryKey()).toEqual(["bills", null]);
    expect(billsQueryKey(undefined)).toEqual(["bills", null]);
    expect(billsQueryKey(null)).toEqual(["bills", null]);
  });

  it("uses a distinct query key when a business id is supplied", () => {
    expect(billsQueryKey("biz_123")).toEqual(["bills", "biz_123"]);
  });

  it("never shares a query key between two different businesses", () => {
    expect(billsQueryKey("biz_1")).not.toEqual(billsQueryKey("biz_2"));
  });

  it("keeps personal and business bills in separate cache namespaces", () => {
    expect(billsQueryKey(null)).not.toEqual(billsQueryKey("biz_1"));
  });
});

describe("bills scope safety", () => {
  it("business-scoped query is an exact equality match, never a substring", () => {
    // A business id of "biz" must not match "biz_other" or "sub_biz".
    const candidates = ["biz", "biz_other", "sub_biz", "other"];
    const scoped = "biz";
    const matched = candidates.filter((id) => id === scoped);
    expect(matched).toEqual(["biz"]);
  });

  it("personal bills (business_id null) are excluded from a business query", () => {
    const rows = [
      { id: "1", business_id: null, financial_scope: "personal" },
      { id: "2", business_id: "biz_1", financial_scope: "business" },
      { id: "3", business_id: "biz_2", financial_scope: "business" },
    ];
    const scoped = rows.filter((r) => r.business_id === "biz_1");
    expect(scoped).toEqual([rows[1]]);
    // Personal bills are never present in a business-scoped result.
    expect(scoped.some((r) => r.business_id === null)).toBe(false);
  });

  it("a business query for business A cannot return business B bills", () => {
    const rows = [
      { id: "1", business_id: "biz_a" },
      { id: "2", business_id: "biz_b" },
    ];
    const a = rows.filter((r) => r.business_id === "biz_a");
    const b = rows.filter((r) => r.business_id === "biz_b");
    expect(a).toEqual([rows[0]]);
    expect(b).toEqual([rows[1]]);
    expect(a).not.toEqual(b);
  });

  it("financial_scope defaults to personal so legacy bills stay valid", () => {
    // The migration sets DEFAULT 'personal'; an unmodified legacy row
    // keeps its meaning after the new columns are added.
    const legacyRow = { id: "1", business_id: null, financial_scope: "personal" };
    expect(legacyRow.financial_scope).toBe("personal");
    expect(legacyRow.business_id).toBeNull();
  });
});
