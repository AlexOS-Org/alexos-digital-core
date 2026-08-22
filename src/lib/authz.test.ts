import { describe, expect, it } from "vitest";
import { isAuthorizedAlexOSUser, unauthorizedWorkspaceMessage } from "./authz";

describe("AlexOS authorization", () => {
  it("allows the configured owner email", () => {
    expect(isAuthorizedAlexOSUser({ email: "alexonkwani@gmail.com" })).toBe(true);
    expect(isAuthorizedAlexOSUser({ email: " ALEXONKWANI@GMAIL.COM " })).toBe(true);
  });

  it("rejects missing and other emails", () => {
    expect(isAuthorizedAlexOSUser(null)).toBe(false);
    expect(isAuthorizedAlexOSUser({ email: undefined })).toBe(false);
    expect(isAuthorizedAlexOSUser({ email: "other@example.com" })).toBe(false);
  });

  it("provides a clear private-workspace message", () => {
    expect(unauthorizedWorkspaceMessage()).toContain("private");
  });
});
