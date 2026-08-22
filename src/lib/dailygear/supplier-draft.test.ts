import { describe, expect, it } from "vitest";
import { createSupplierProductDraft } from "./supplier-draft";

describe("DailyGear supplier drafts", () => {
  it("extracts a candidate from a selected source without publishing it", () => {
    const draft = createSupplierProductDraft({
      sourceLabel: "Approved supplier group export",
      sourceType: "selected_group_export",
      messageId: "msg-7",
      text: "NAVIFORCE NF5060\nKES 2,700\nhttps://supplier.example/nf5060",
      mediaUrls: ["https://supplier.example/nf5060.jpg"],
    });

    expect(draft.status).toBe("draft");
    expect(draft.candidateName).toBe("NAVIFORCE NF5060");
    expect(draft.supplierPrice).toBe(2700);
    expect(draft.sourceLinks).toEqual(["https://supplier.example/nf5060"]);
    expect(draft.candidateMediaUrls).toEqual(["https://supplier.example/nf5060.jpg"]);
    expect(draft.approvalNotes.join(" ")).toContain("at least 15 units");
  });

  it("does not invent a price when the selected message has none", () => {
    const draft = createSupplierProductDraft({
      sourceLabel: "Pasted supplier message",
      sourceType: "pasted_message",
      text: "Black laptop sleeve available tomorrow",
    });
    expect(draft.supplierPrice).toBeNull();
    expect(draft.currency).toBe("UNKNOWN");
    expect(draft.status).toBe("draft");
  });
});
