import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../..");

function source(relativePath: string): string {
  return readFileSync(resolve(root, relativePath), "utf8");
}

describe("AlexOS product language", () => {
  it("uses the approved business and Auren names in the navigation and shell", () => {
    const sources = [
      source("src/lib/modules.ts"),
      source("src/routes/_authenticated/businesses.tsx"),
      source("src/routes/_authenticated/route.tsx"),
      source("src/routes/auth.tsx"),
      source("src/components/dashboard/DashboardKpiStrip.tsx"),
      source("src/components/dashboard/MoneySnapshot.tsx"),
    ].join("\n");

    expect(sources).toContain("Nuvora");
    expect(sources).toContain("CarBar Motion");
    expect(sources).toContain("Auren Intelligence");
    expect(sources).not.toContain("Novera");
    expect(sources).not.toContain("Car-Bar Motion.ke");
    expect(sources).not.toContain("AI assistant");
    expect(sources).not.toContain("Alex OS");
    expect(sources).not.toContain('label: "Total net worth"');
    expect(sources).not.toContain('title: "Net Worth"');
  });
});

describe("truthful roadmap labels", () => {
  it("does not present local workbenches as validated or ready", () => {
    const workbench = source("src/components/modules/ModuleWorkbench.tsx");
    const placeholder = source("src/components/module-placeholder.tsx");
    const modules = source("src/lib/modules.ts");

    expect(workbench).toContain("Local Draft");
    expect(workbench).toContain("function write");
    expect(workbench).toContain("Device-only previews remain usable");
    expect(workbench).not.toContain("V1 workspace");
    expect(workbench).not.toContain("Ready for Phase 3 validation");
    expect(placeholder).toContain("Roadmap preview");
    expect(placeholder).toContain("No persistent records");
    expect(placeholder).toContain("Persistence and integrations pending");
    expect(placeholder).not.toContain("Coming Soon");
    expect(placeholder).not.toContain("Build in Progress");
    expect(modules.match(/description: "Roadmap preview/g)?.length).toBeGreaterThanOrEqual(10);
  });
});
