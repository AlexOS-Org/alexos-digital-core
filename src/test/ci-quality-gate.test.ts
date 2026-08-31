import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function read(file: string): string {
  return readFileSync(resolve(root, file), "utf8");
}

const REQUIRED_STEPS = [
  "npm test",
  "npm run lint",
  "npm run typecheck",
  "npm run build",
  "node scripts/assert-public-storefront-untouched.mjs",
];

describe("CI quality gates", () => {
  it("package.json exposes a single verify script that runs the full gate", () => {
    const pkg = JSON.parse(read("package.json")) as { scripts?: Record<string, string> };
    const verify = pkg.scripts?.verify;

    expect(verify, "package.json must define a scripts.verify command").toBeTruthy();

    for (const step of REQUIRED_STEPS) {
      expect(verify).toContain(step);
    }
  });

  it("the main validation workflow installs and runs the full verify gate", () => {
    const workflow = read(".github/workflows/validate.yml");

    expect(workflow).toContain("npm ci");
    expect(workflow).toContain("npm run verify");
  });

  it("the PR and production verification workflows run the full verify gate", () => {
    for (const file of [
      ".github/workflows/pr-verify.yml",
      ".github/workflows/production-verify.yml",
    ]) {
      const workflow = read(file);
      expect(workflow).toContain("npm ci");
      expect(workflow).toContain("npm run verify");
    }
  });
});
