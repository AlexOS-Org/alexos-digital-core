import { describe, expect, it } from "vitest";
import { summarizeCurrencySafety } from "./currency-safety";

describe("Money Center currency safety", () => {
  it("allows aggregate display when all active accounts share one currency", () => {
    expect(
      summarizeCurrencySafety([
        { currency: "KES", status: "active" },
        { currency: "KES", status: "active" },
      ]),
    ).toEqual({ currency: "KES", isMixed: false });
  });

  it("withholds aggregate display when active accounts use multiple currencies", () => {
    expect(
      summarizeCurrencySafety([
        { currency: "KES", status: "active" },
        { currency: "USD", status: "active" },
      ]),
    ).toEqual({ currency: null, isMixed: true });
  });

  it("ignores archived accounts and blank currency values", () => {
    expect(
      summarizeCurrencySafety([
        { currency: "KES", status: "active" },
        { currency: "USD", status: "archived" },
        { currency: "", status: "active" },
        { currency: null, status: "active" },
      ]),
    ).toEqual({ currency: "KES", isMixed: false });
  });
});
