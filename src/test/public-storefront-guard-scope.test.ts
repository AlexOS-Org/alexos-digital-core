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
});
