import { describe, expect, it } from "vitest";
import {
  fulizaAccessFee,
  fulizaDailyFee,
  isMpesaAccountName,
  overdraftAmount,
  planFulizaFees,
  fulizaAccessReference,
  fulizaDailyReference,
} from "./fuliza";

describe("isMpesaAccountName", () => {
  it("matches M-Pesa variants", () => {
    expect(isMpesaAccountName("M-Pesa")).toBe(true);
    expect(isMpesaAccountName("Mpesa Business")).toBe(true);
    expect(isMpesaAccountName("My M-PESA")).toBe(true);
    expect(isMpesaAccountName("KCB")).toBe(false);
    expect(isMpesaAccountName("Cash")).toBe(false);
  });
});

describe("fuliza fees", () => {
  it("access fee is 1%", () => {
    expect(fulizaAccessFee(1000)).toBe(10);
    expect(fulizaAccessFee(250)).toBe(2.5);
    expect(fulizaAccessFee(0)).toBe(0);
  });

  it("daily fee bands", () => {
    expect(fulizaDailyFee(50)).toBe(0);
    expect(fulizaDailyFee(200)).toBe(3);
    expect(fulizaDailyFee(800)).toBe(6);
    expect(fulizaDailyFee(1200)).toBe(21.6);
    expect(fulizaDailyFee(2000)).toBe(24);
    expect(fulizaDailyFee(5000)).toBe(30);
  });

  it("overdraftAmount", () => {
    expect(overdraftAmount(-500)).toBe(500);
    expect(overdraftAmount(100)).toBe(0);
  });
});

describe("planFulizaFees", () => {
  it("skips non-mpesa", () => {
    expect(
      planFulizaFees({
        accountId: "a1",
        accountName: "KCB",
        openingBalance: 0,
        currentBalance: -500,
        txs: [],
        todayKey: "2026-09-11",
      }),
    ).toEqual([]);
  });

  it("skips non-negative balance", () => {
    expect(
      planFulizaFees({
        accountId: "a1",
        accountName: "M-Pesa",
        openingBalance: 1000,
        currentBalance: 100,
        txs: [],
        todayKey: "2026-09-11",
      }),
    ).toEqual([]);
  });

  it("plans access + daily when overdrawn", () => {
    const plan = planFulizaFees({
      accountId: "acc-mpesa",
      accountName: "M-Pesa",
      openingBalance: 0,
      currentBalance: -800,
      txs: [
        {
          type: "expense",
          amount: 800,
          account_id: "acc-mpesa",
          occurred_at: "2026-09-10T10:00:00.000Z",
          status: "posted",
        },
      ],
      todayKey: "2026-09-11",
    });
    expect(plan.map((p) => p.kind).sort()).toEqual(["access", "daily"]);
    expect(plan.find((p) => p.kind === "access")?.amount).toBe(8);
    expect(plan.find((p) => p.kind === "daily")?.amount).toBe(6);
    expect(plan.find((p) => p.kind === "access")?.reference).toBe(
      fulizaAccessReference("acc-mpesa", "2026-09-10"),
    );
    expect(plan.find((p) => p.kind === "daily")?.reference).toBe(
      fulizaDailyReference("acc-mpesa", "2026-09-11"),
    );
  });

  it("is idempotent when refs already exist", () => {
    const plan = planFulizaFees({
      accountId: "acc-mpesa",
      accountName: "M-Pesa",
      openingBalance: 0,
      currentBalance: -800,
      txs: [
        {
          type: "expense",
          amount: 800,
          account_id: "acc-mpesa",
          occurred_at: "2026-09-10T10:00:00.000Z",
          status: "posted",
        },
        {
          type: "expense",
          amount: 8,
          account_id: "acc-mpesa",
          occurred_at: "2026-09-10T10:01:00.000Z",
          status: "posted",
          reference: fulizaAccessReference("acc-mpesa", "2026-09-10"),
        },
        {
          type: "expense",
          amount: 6,
          account_id: "acc-mpesa",
          occurred_at: "2026-09-11T00:05:00.000Z",
          status: "posted",
          reference: fulizaDailyReference("acc-mpesa", "2026-09-11"),
        },
      ],
      todayKey: "2026-09-11",
    });
    expect(plan).toEqual([]);
  });
});
