import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createSupplierProductDraft } from "./supplier-draft";

describe("supplier export fixture", () => {
  it("extracts the first selected message without treating the whole export as an approval", () => {
    const exportText = readFileSync("notes/sample-supplier-export.txt", "utf8");
    const firstMessage = exportText.split("\n\n")[0] ?? "";
    const draft = createSupplierProductDraft({
      sourceLabel: "Sample supplier export",
      sourceType: "selected_group_export",
      text: firstMessage,
      mediaUrls: ["https://supplier.example/nf5060-black.jpg"],
    });

    expect(draft.status).toBe("draft");
    expect(draft.candidateName).toContain("[22/08/2026, 10:14]");
    expect(draft.supplierPrice).toBe(2700);
    expect(draft.sourceLinks).toEqual([
      "https://supplier.example/nf5060-black.jpg",
      "https://supplier.example/nf5060",
    ]);
    expect(draft.candidateMediaUrls).toEqual(["https://supplier.example/nf5060-black.jpg"]);
  });
});
