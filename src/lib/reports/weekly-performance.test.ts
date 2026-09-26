import { describe, expect, it } from "vitest";
import {
  computeWeeklyFinancials,
  generateAurenWeeklyObservations,
  getWeekBoundaries,
  summarizeWeeklyEcommerce,
  summarizeWeeklyWebVitals,
} from "./weekly-performance";
import type { Account, Expected, Transaction } from "@/lib/money/api";
import type { DailyGearProfitCashFlowResponse } from "@/lib/dailygear/profit-cash-flow.server";

describe("Weekly Performance Data Layer", () => {
  describe("getWeekBoundaries", () => {
    it("computes explicit Monday to Sunday boundaries for a given date", () => {
      // Wednesday, Sep 16, 2026
      const refDate = new Date("2026-09-16T12:00:00Z");
      const currentWeek = getWeekBoundaries(refDate, 0);

      expect(currentWeek.from).toBe("2026-09-14"); // Monday
      expect(currentWeek.until).toBe("2026-09-20"); // Sunday
      expect(currentWeek.label).toBe("This Week");
      expect(currentWeek.isCurrentWeek).toBe(true);
    });

    it("computes previous week boundaries when offset is -1", () => {
      const refDate = new Date("2026-09-16T12:00:00Z");
      const lastWeek = getWeekBoundaries(refDate, -1);

      expect(lastWeek.from).toBe("2026-09-07");
      expect(lastWeek.until).toBe("2026-09-13");
      expect(lastWeek.label).toBe("Last Week");
      expect(lastWeek.isCurrentWeek).toBe(false);
    });
  });

  describe("computeWeeklyFinancials", () => {
    const mockAccounts: Account[] = [
      {
        id: "acc-1",
        user_id: "u-1",
        name: "M-Pesa",
        icon: "smartphone",
        color: "#000",
        type: "mobile_money",
        currency: "KES",
        opening_balance: 0,
        status: "active",
        sort_order: 1,
        deleted_at: null,
        created_at: "2026-01-01",
        financial_scope: "business",
        business_name: "DailyGear",
        business_id: null,
      },
    ];

    it("aggregates posted transactions strictly within the week window", () => {
      const transactions: Transaction[] = [
        {
          id: "tx-1",
          user_id: "u-1",
          occurred_at: "2026-09-14T10:00:00Z", // In week
          type: "income",
          amount: 5000,
          account_id: "acc-1",
          transfer_account_id: null,
          category: "Sales",
          source: "Customer",
          description: "Sale 1",
          reference: "ref-1",
          business_id: null,
          financial_scope: "business",
          business_name: "DailyGear",
          income_type: "sales_revenue",
          expense_type: null,
          expense_scope: null,
          attachment_url: null,
          status: "posted",
          deleted_at: null,
          created_at: "2026-09-14T10:00:00Z",
        },
        {
          id: "tx-2",
          user_id: "u-1",
          occurred_at: "2026-09-15T10:00:00Z", // In week
          type: "expense",
          amount: 1500,
          account_id: "acc-1",
          transfer_account_id: null,
          category: "Supplies",
          source: "Vendor",
          description: "Supplies",
          reference: "ref-2",
          business_id: null,
          financial_scope: "business",
          business_name: "DailyGear",
          income_type: null,
          expense_type: "operating",
          expense_scope: null,
          attachment_url: null,
          status: "posted",
          deleted_at: null,
          created_at: "2026-09-15T10:00:00Z",
        },
        {
          id: "tx-3",
          user_id: "u-1",
          occurred_at: "2026-09-01T10:00:00Z", // Outside week
          type: "income",
          amount: 10000,
          account_id: "acc-1",
          transfer_account_id: null,
          category: "Sales",
          source: "Customer",
          description: "Old sale",
          reference: "ref-3",
          business_id: null,
          financial_scope: "business",
          business_name: "DailyGear",
          income_type: "sales_revenue",
          expense_type: null,
          expense_scope: null,
          attachment_url: null,
          status: "posted",
          deleted_at: null,
          created_at: "2026-09-01T10:00:00Z",
        },
      ];

      const result = computeWeeklyFinancials(
        transactions,
        mockAccounts,
        [],
        "2026-09-14",
        "2026-09-20",
      );

      expect(result.hasTransactions).toBe(true);
      expect(result.transactionCount).toBe(2);
      expect(result.income).toBe(5000);
      expect(result.expenses).toBe(1500);
      expect(result.netCashFlow).toBe(3500);
      expect(result.isMixedCurrency).toBe(false);
      expect(result.currency).toBe("KES");
    });

    it("reports courier prepayments separately from sales cash flow", () => {
      const result = computeWeeklyFinancials([], mockAccounts, [], "2026-09-14", "2026-09-20", [
        {
          order_id: "order-1",
          amount: 350,
          status: "paid",
          paid_at: "2026-09-16T10:00:00Z",
          due_on_delivery: 850,
          currency: "KES",
        },
      ]);

      expect(result.income).toBeNull();
      expect(result.courierPrepaymentCount).toBe(1);
      expect(result.courierPrepaymentTotal).toBe(350);
      expect(result.courierAmountDue).toBe(850);
    });

    it("withholds totals when accounts have mixed currencies", () => {
      const mixedAccounts: Account[] = [
        ...mockAccounts,
        {
          id: "acc-2",
          user_id: "u-1",
          name: "USD Bank",
          icon: "landmark",
          color: "#000",
          type: "bank",
          currency: "USD",
          opening_balance: 0,
          status: "active",
          sort_order: 2,
          deleted_at: null,
          created_at: "2026-01-01",
          financial_scope: "business",
          business_name: "DailyGear",
          business_id: null,
        },
      ];

      const result = computeWeeklyFinancials([], mixedAccounts, [], "2026-09-14", "2026-09-20");

      expect(result.isMixedCurrency).toBe(true);
      expect(result.currency).toBeNull();
      expect(result.income).toBeNull();
      expect(result.expenses).toBeNull();
      expect(result.netCashFlow).toBeNull();
      expect(result.warning).toContain("multiple currencies");
    });

    it("returns explicit no-data representation when no transactions exist in the week", () => {
      const result = computeWeeklyFinancials([], mockAccounts, [], "2026-09-14", "2026-09-20");

      expect(result.hasTransactions).toBe(false);
      expect(result.transactionCount).toBe(0);
      expect(result.income).toBeNull();
      expect(result.expenses).toBeNull();
      expect(result.netCashFlow).toBeNull();
    });
  });

  describe("summarizeWeeklyEcommerce", () => {
    it("handles unavailable Meta Ads spend without fabricating zeroes", () => {
      const mockResponse: DailyGearProfitCashFlowResponse = {
        financials: {
          currency: "KES",
          period: { from: "2026-09-14", until: "2026-09-20" },
          orders: 5,
          paidOrders: 4,
          revenue: 12500,
          cogs: 6000,
          grossProfit: 6500,
          grossMarginPct: 52,
          adSpend: 0,
          paymentFees: 200,
          deliveryCosts: 500,
          supplierPayments: 0,
          otherOperatingOutflows: 0,
          businessOperatingExpenses: 0,
          operatingExpenses: 700,
          operatingProfit: 5800,
          operatingMarginPct: 46.4,
          cashReceived: 10000,
          cashOutflows: 700,
          netCashFlow: 9300,
          cashConversionPct: 93,
          revenuePerAdSpend: null,
          profitAfterAdSpend: 5800,
          daily: [],
          dataQuality: {
            cashReceiptMethod: "paid_order_inference",
            adInsightRows: 0,
            missingCogsItemCount: 0,
            currencies: ["KES"],
            warnings: [],
          },
        },
        meta: {
          readOnly: true,
          source: "unavailable",
          available: false,
          error: "Meta API access token is not configured.",
          accountCount: 0,
          campaignCount: 0,
          adSetCount: 0,
          adCount: 0,
          insightCount: 0,
          cache: { hit: false, fetchedAt: "", expiresAt: "", ttlMs: 0 },
        },
      };

      const summary = summarizeWeeklyEcommerce(mockResponse);

      expect(summary.hasOrders).toBe(true);
      expect(summary.orders).toBe(5);
      expect(summary.revenue).toBe(12500);
      expect(summary.metaSpendStatus).toBe("unavailable");
      expect(summary.metaSpend).toBeNull(); // No fake 0!
      expect(summary.metaSpendReason).toContain("Meta API");
    });
  });

  describe("summarizeWeeklyWebVitals", () => {
    it("returns no_data status when telemetry is empty", () => {
      const summary = summarizeWeeklyWebVitals([]);
      expect(summary.status).toBe("no_data");
      expect(summary.totalEvents).toBe(0);
    });

    it("summarizes counts and ratings accurately when events exist", () => {
      const events = [
        { metric_name: "LCP", metric_rating: "good", metric_value: 1200, created_at: "2026-09-15" },
        { metric_name: "LCP", metric_rating: "good", metric_value: 1400, created_at: "2026-09-15" },
        { metric_name: "CLS", metric_rating: "poor", metric_value: 0.35, created_at: "2026-09-16" },
      ];

      const summary = summarizeWeeklyWebVitals(events);
      expect(summary.status).toBe("ready");
      expect(summary.totalEvents).toBe(3);
      expect(summary.goodCount).toBe(2);
      expect(summary.poorCount).toBe(1);
      expect(summary.metrics.lcp?.count).toBe(2);
      expect(summary.metrics.lcp?.rating).toBe("good");
      expect(summary.metrics.cls?.rating).toBe("poor");
    });
  });

  describe("generateAurenWeeklyObservations", () => {
    it("synthesizes honest observations without hallucinating metrics", () => {
      const financials = computeWeeklyFinancials([], [], [], "2026-09-14", "2026-09-20");
      const ecommerce = summarizeWeeklyEcommerce(null);
      const vitals = summarizeWeeklyWebVitals([]);

      const obs = generateAurenWeeklyObservations(financials, ecommerce, vitals);

      expect(obs.some((o) => o.id === "obs-financial-waiting")).toBe(true);
      expect(obs.some((o) => o.id === "obs-ecommerce-waiting")).toBe(true);
      expect(obs.some((o) => o.id === "obs-vitals-waiting")).toBe(true);
    });
  });
});
