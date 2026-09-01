import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function read(file: string): string {
  return readFileSync(resolve(root, file), "utf8");
}

const PUBLIC_PATTERNS = [
  "/^src\\/routes\\/shop\\./",
  "/^src\\/routes\\/funnel\\.\\$slug\\.tsx$/",
  "/^src\\/components\\/storefront\\//",
  "/^src\\/styles\\.css$/",
  "/^public\\/storefront\\//",
];

const APPROVED_PUBLIC_PATH = "/^src\\/routes\\/shop\\.product\\.\\$id\\.tsx$/";

describe("public storefront immutability guard scope", () => {
  it("must still protect every public-facing DailyGear surface", () => {
    const guard = read("scripts/assert-public-storefront-untouched.mjs");

    for (const pattern of PUBLIC_PATTERNS) {
      expect(guard).toContain(pattern);
    }
  });

  it("must not freeze the admin commerce domain as if it were public storefront", () => {
    const guard = read("scripts/assert-public-storefront-untouched.mjs");

    // The guard is a *public storefront* guard. The authenticated admin
    // commerce layer (src/lib/dailygear/*) must be allowed to change so the
    // owner can manage products, pricing, variants, stock and readiness.
    expect(guard).not.toContain("/^src\\/lib\\/dailygear\\//");
  });

  it("only allows the explicitly approved premium product page among public files", () => {
    const guard = read("scripts/assert-public-storefront-untouched.mjs");

    expect(guard).toContain("approvedPublicPaths");
    expect(guard).toContain(APPROVED_PUBLIC_PATH);
    // Any other protected public route/component must remain blocked.
    expect(guard).toContain("/^src\\/components\\/storefront\\//");
    expect(guard).toContain("/^src\\/routes\\/funnel\\.\\$slug\\.tsx$/");
  });
});
