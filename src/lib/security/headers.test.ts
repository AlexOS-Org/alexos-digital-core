import { describe, expect, it } from "vitest";
import { withSecurityHeaders } from "./headers";

describe("withSecurityHeaders", () => {
  it("adds baseline browser security headers without replacing existing response headers", () => {
    const response = withSecurityHeaders(
      new Response("ok", {
        headers: { "content-type": "text/plain", "x-existing": "keep" },
      }),
    );

    expect(response.headers.get("content-type")).toBe("text/plain");
    expect(response.headers.get("x-existing")).toBe("keep");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("x-frame-options")).toBe("SAMEORIGIN");
    expect(response.headers.get("referrer-policy")).toBe("strict-origin-when-cross-origin");
    expect(response.headers.get("permissions-policy")).toBe(
      "camera=(), microphone=(), geolocation=()",
    );
  });
});

it("does not mutate the original response headers", () => {
  const original = new Response("ok");
  withSecurityHeaders(original);

  expect(original.headers.get("x-content-type-options")).toBeNull();
});
