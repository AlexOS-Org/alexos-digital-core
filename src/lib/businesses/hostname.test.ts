import { describe, expect, it } from "vitest";
import { resolveBusinessByHostname, resolveHostnameFromRequest } from "./hostname";

describe("resolveBusinessByHostname", () => {
  it("resolves DailyGear hostnames", () => {
    expect(resolveBusinessByHostname("dailygear.co.ke")).toBe("dailygear");
    expect(resolveBusinessByHostname("www.dailygear.co.ke")).toBe("dailygear");
    expect(resolveBusinessByHostname("app.dailygear.co.ke")).toBe("dailygear");
    expect(resolveBusinessByHostname("DAILYGEAR.CO.KE")).toBe("dailygear");
  });

  it("resolves Novera hostname", () => {
    expect(resolveBusinessByHostname("novera.dailygear.co.ke")).toBe("novera");
  });

  it("resolves CarBar Motion hostname", () => {
    expect(resolveBusinessByHostname("cbm.dailygear.co.ke")).toBe("carbaramotion");
    expect(resolveBusinessByHostname("cbm.co.ke")).toBe("carbaramotion");
  });

  it("returns null for portfolio hostnames", () => {
    expect(resolveBusinessByHostname("alexos.co.ke")).toBeNull();
    expect(resolveBusinessByHostname("app.alexos.co.ke")).toBeNull();
    expect(resolveBusinessByHostname("localhost")).toBeNull();
    expect(resolveBusinessByHostname("127.0.0.1")).toBeNull();
  });

  it("returns null for unknown hostnames", () => {
    expect(resolveBusinessByHostname("example.com")).toBeNull();
    expect(resolveBusinessByHostname("unknown.dailygear.co.ke")).toBeNull();
    expect(resolveBusinessByHostname("")).toBeNull();
  });
});

describe("resolveHostnameFromRequest", () => {
  it("extracts hostname from request Host header", () => {
    const request = new Request("https://cbm.dailygear.co.ke/dashboard", {
      headers: { host: "cbm.dailygear.co.ke" },
    });
    expect(resolveHostnameFromRequest(request)).toBe("carbaramotion");
  });

  it("strips port number from Host header", () => {
    const request = new Request("https://localhost:5173/dashboard", {
      headers: { host: "localhost:5173" },
    });
    expect(resolveHostnameFromRequest(request)).toBeNull();
  });

  it("returns null when Host header is missing", () => {
    const request = new Request("https://example.com", { headers: {} });
    expect(resolveHostnameFromRequest(request)).toBeNull();
  });

  it("resolves DailyGear hostname from request", () => {
    const request = new Request("https://dailygear.co.ke/shop", {
      headers: { host: "dailygear.co.ke" },
    });
    expect(resolveHostnameFromRequest(request)).toBe("dailygear");
  });
});
