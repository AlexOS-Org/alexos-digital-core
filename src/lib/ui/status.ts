/**
 * AlexOS status vocabulary.
 *
 * Every status string the product can display is resolved here to exactly one
 * semantic tone and one human-readable label. Screens never invent their own
 * colour for a status — that was the single largest source of inconsistency in
 * the audit (five different mechanisms were in use across Money Center alone).
 *
 * The map is presentation-only. It does not change, infer or reorder any
 * business state; it only decides how an existing status looks.
 */

export type AlexOSTone =
  | "income"
  | "expense"
  | "debt"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral"
  | "pending"
  | "overdue"
  | "partial"
  | "paid"
  | "cancelled"
  | "active"
  | "inactive"
  | "processing";

/**
 * status string -> tone.
 *
 * Covers every enum in the product: transaction_status, bill_status,
 * contact_status, lead_stage, crm_task_status, order status, payment status,
 * product status, funnel status, Auren feed/decision/public-context status, and
 * the derived bill due states surfaced by the bills engine.
 */
const STATUS_TONE: Record<string, AlexOSTone> = {
  /* Money — transactions */
  posted: "paid",
  pending: "pending",
  void: "cancelled",
  voided: "cancelled",

  /* Money — bills */
  paid: "paid",
  active: "active",
  cancelled: "cancelled",
  overdue: "overdue",
  due_today: "warning",
  upcoming: "pending",
  scheduled: "pending",
  due_soon: "warning",
  no_date: "neutral",

  /* Money — direction */
  income: "income",
  expense: "expense",
  transfer: "info",
  adjustment: "neutral",

  /* Money — expected money */
  received: "paid",
  expected: "pending",
  partial: "partial",

  /* Money — obligations */
  debt: "debt",
  overdrawn: "expense",
  fuliza: "expense",

  /* Commerce — orders */
  new: "info",
  processing: "processing",
  packed: "processing",
  shipped: "info",
  delivered: "paid",
  returned: "cancelled",
  refunded: "cancelled",
  unpaid: "overdue",
  out_of_stock: "danger",
  low_stock: "warning",

  /* Commerce — catalogue / funnels */
  draft: "neutral",
  published: "active",
  unpublished: "inactive",
  approved: "success",
  rejected: "danger",

  inactive: "inactive",
  archived: "inactive",

  /* CRM */
  lead: "info",
  contacted: "info",
  qualified: "info",
  proposal: "processing",
  negotiation: "warning",
  won: "paid",
  lost: "cancelled",
  done: "paid",
  open: "pending",

  /* System */
  completed: "paid",
  complete: "paid",
  failed: "danger",
  error: "danger",
  warning: "warning",
  info: "info",
  neutral: "neutral",
};

/**
 * Words that must not be naively title-cased, or that read better as-is.
 * Keeps labels identical to the wording the rest of AlexOS already uses.
 */
const STATUS_LABEL: Record<string, string> = {
  due_today: "Due today",
  due_soon: "Due soon",
  out_of_stock: "Out of stock",
  low_stock: "Low stock",
  fuliza: "Fuliza",
};

const TONE_CACHE = new Map<string, AlexOSTone>();
const LABEL_CACHE = new Map<string, string>();

/** Resolve any status-ish string to its semantic tone. Unknown values are neutral. */
export function alexosStatusTone(status: string | null | undefined): AlexOSTone {
  if (!status) return "neutral";
  const key = status.toLowerCase();
  const cached = TONE_CACHE.get(key);
  if (cached) return cached;
  const tone = STATUS_TONE[key] ?? "neutral";
  TONE_CACHE.set(key, tone);
  return tone;
}

/** Resolve any status-ish string to its display label. */
export function alexosStatusLabel(status: string | null | undefined): string {
  if (!status) return "Unknown";
  const key = status.toLowerCase();
  const cached = LABEL_CACHE.get(key);
  if (cached) return cached;
  const label = STATUS_LABEL[key] ?? humanize(key);
  LABEL_CACHE.set(key, label);
  return label;
}

function humanize(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .trim()
    .split(/\s+/)
    .map((word) => (word.length <= 2 ? word : word[0].toUpperCase() + word.slice(1)))
    .join(" ");
}

/** Tone for a sign-bearing money value. Positive is income, negative is expense. */
export function alexosAmountTone(amount: number | null | undefined): AlexOSTone {
  if (amount == null || !Number.isFinite(amount) || amount === 0) return "neutral";
  return amount > 0 ? "income" : "expense";
}

/** Direction label used alongside signed amounts. */
export function alexosAmountDirection(
  amount: number | null | undefined,
): "Income" | "Expense" | "Neutral" {
  const tone = alexosAmountTone(amount);
  if (tone === "income") return "Income";
  if (tone === "expense") return "Expense";
  return "Neutral";
}
