import { describe, expect, it } from "vitest";
import { getAccountLogo, getInstitutionKey } from "./institution-branding";

describe("account institution branding", () => {
  it.each([
    ["Absa Bank", "absa"],
    ["A.B.S.A. Bank", "absa"],
    ["NCBA Bank", "ncba"],
    ["N.C.B.A. Bank", "ncba"],
    ["Family Bank", "family"],
    ["Family-Bank", "family"],
    ["Equity Bank", "equity"],
    ["Equity-Bank", "equity"],
  ])("maps %s to the %s brand and logo", (name, key) => {
    expect(getInstitutionKey(name)).toBe(key);
    expect(getAccountLogo(name)).toMatch(/^data:image\/svg\+xml,/);
  });
});
