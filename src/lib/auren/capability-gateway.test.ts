import { describe, expect, it } from "vitest";
import {
  authorizeCapability,
  listReadOnlyCapabilities,
  readOnlyCapabilityRegistry,
  type CapabilityAccessRequest,
} from "./capability-gateway";

describe("Auren capability gateway", () => {
  it("exposes read-only first-party and analytics capabilities by default", () => {
    const capabilities = listReadOnlyCapabilities();

    expect(capabilities.map((capability) => capability.id)).toEqual(
      expect.arrayContaining(["supabase:read", "dailygear:read", "analytics:read"]),
    );
    expect(capabilities.every((capability) => capability.authorization === "read_only")).toBe(true);
  });

  it("allows a read-only capability for a matching workspace user", () => {
    const request: CapabilityAccessRequest = {
      capabilityId: "supabase:read",
      userId: "user-1",
      requestedUserId: "user-1",
      requestedBusinessId: "business-1",
    };

    const result = authorizeCapability(request);

    expect(result.allowed).toBe(true);
    expect(result.reason).toBeNull();
  });

  it("rejects a read-only capability when the caller is not the data owner", () => {
    const request: CapabilityAccessRequest = {
      capabilityId: "supabase:read",
      userId: "user-1",
      requestedUserId: "user-2",
      requestedBusinessId: "business-1",
    };

    const result = authorizeCapability(request);

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("workspace_scope_mismatch");
  });

  it("rejects mutation capabilities until they are explicitly approved", () => {
    const request: CapabilityAccessRequest = {
      capabilityId: "finance:write",
      userId: "user-1",
      requestedUserId: "user-1",
      requestedBusinessId: "business-1",
    };

    const result = authorizeCapability(request);

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("mutation_not_approved");
  });

  it("never registers a mutation capability in the read-only registry", () => {
    expect(
      readOnlyCapabilityRegistry.some((capability) => capability.authorization !== "read_only"),
    ).toBe(false);
  });

  it("keeps the registry ordered and deterministic", () => {
    const ids = readOnlyCapabilityRegistry.map((capability) => capability.id);
    expect(ids).toEqual([...ids].sort());
  });
});
