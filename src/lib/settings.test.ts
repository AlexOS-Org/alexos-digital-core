import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(import.meta.dirname, "../routes/_authenticated/settings.tsx"),
  "utf8",
);

describe("Settings truthfulness", () => {
  it("identifies the screen as a read-only preview until persistence exists", () => {
    expect(source).toContain("read-only preview");
    expect(source).toContain("Persistence not connected");
    expect(source).not.toContain("Settings Saved!");
    expect(source).not.toContain(">Enable</Button>");
    expect(source).not.toContain(">Configure</Button>");
  });
});
