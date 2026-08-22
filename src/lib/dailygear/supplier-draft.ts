export type SupplierDraftStatus = "draft" | "approved" | "rejected";

export interface SupplierMessageInput {
  sourceLabel: string;
  sourceType: "selected_chat_export" | "selected_group_export" | "pasted_message";
  messageId?: string;
  sentAt?: string;
  senderName?: string;
  text: string;
  mediaUrls?: string[];
}

export interface SupplierProductDraft {
  status: SupplierDraftStatus;
  source: Pick<
    SupplierMessageInput,
    "sourceLabel" | "sourceType" | "messageId" | "sentAt" | "senderName"
  >;
  rawText: string;
  candidateName: string;
  supplierPrice: number | null;
  currency: "KES" | "UNKNOWN";
  sourceLinks: string[];
  candidateMediaUrls: string[];
  approvalNotes: string[];
}

const KES_PRICE = /(?:k(?:es|sh)|k)\.?\s*([0-9][0-9,]*(?:\.\d{1,2})?)/gi;
const URL_PATTERN = /https?:\/\/[^\s<>()]+/gi;

function parsePrice(text: string) {
  const match = KES_PRICE.exec(text);
  KES_PRICE.lastIndex = 0;
  if (!match) return null;
  const amount = Number(match[1].replace(/,/g, ""));
  return Number.isFinite(amount) ? amount : null;
}

function candidateName(text: string) {
  const firstLine =
    text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find(Boolean) ?? "Supplier product candidate";
  return firstLine.replace(/^(product|item|name)\s*[:-]\s*/i, "").slice(0, 160);
}

/**
 * This parser is intentionally limited to text the user has selected and
 * supplied. It creates a review draft; it does not access WhatsApp globally,
 * download media, create catalogue rows, or publish a funnel.
 */
export function createSupplierProductDraft(input: SupplierMessageInput): SupplierProductDraft {
  const text = input.text.trim().slice(0, 12_000);
  const sourceLinks = [...text.matchAll(URL_PATTERN)].map((match) => match[0]).slice(0, 20);
  const supplierPrice = parsePrice(text);
  const mediaUrls = (input.mediaUrls ?? [])
    .filter((url) => /^https?:\/\/[^\s<>()]+$/i.test(url))
    .slice(0, 10);
  const approvalNotes = [
    "Verify supplier identity and the message source before approval.",
    "Confirm colour/size availability; set Out of stock whenever a variant should stop accepting orders.",
    "Approve specific product media only; unapproved media is not saved to the catalogue.",
    supplierPrice == null
      ? "Supplier price was not detected; enter and verify it manually."
      : "Supplier price detected from selected source text; verify before use.",
  ];
  return {
    status: "draft",
    source: {
      sourceLabel: input.sourceLabel,
      sourceType: input.sourceType,
      messageId: input.messageId,
      sentAt: input.sentAt,
      senderName: input.senderName,
    },
    rawText: text,
    candidateName: candidateName(text),
    supplierPrice,
    currency: supplierPrice == null ? "UNKNOWN" : "KES",
    sourceLinks,
    candidateMediaUrls: mediaUrls,
    approvalNotes,
  };
}
