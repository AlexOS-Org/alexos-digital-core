import { describe, expect, it } from "vitest";
import { weeklySalesTotals, type CustomerSale } from "./customer-sales";

describe("customer sales weekly synchronization", () => {
  it("counts all non-cancelled sales as actual but only verified value as qualified", () => {
    const sales = [
      {
        kpi_id: "loans",
        sale_date: "2026-10-06",
        product_status: "sold",
        actual_value: 500000,
        qualified_value: 500000,
        qualification_status: "verified",
      },
      {
        kpi_id: "loans",
        sale_date: "2026-10-07",
        product_status: "sold",
        actual_value: 250000,
        qualified_value: 250000,
        qualification_status: "pending",
      },
      {
        kpi_id: "loans",
        sale_date: "2026-10-08",
        product_status: "cancelled",
        actual_value: 100000,
        qualified_value: 100000,
        qualification_status: "verified",
      },
    ] as CustomerSale[];
    const totals = weeklySalesTotals(sales, [{ id: "loans" } as never], "2026-10-05");
    expect(totals.get("loans")).toEqual({ actual: 750000, qualified: 500000 });
  });

  it("ignores sales outside the selected week", () => {
    const sales = [
      {
        kpi_id: "mobi",
        sale_date: "2026-10-01",
        product_status: "sold",
        actual_value: 1,
        qualified_value: 1,
        qualification_status: "verified",
      },
    ] as CustomerSale[];
    expect(weeklySalesTotals(sales, [], "2026-10-05").size).toBe(0);
  });
});
