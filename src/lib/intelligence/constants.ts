import type { SignalCategory, SignalPriority } from "./types";

export const CATEGORY_LABELS: Record<SignalCategory, string> = {
  money: "Money",
  crm: "Relationships",
  business: "Business",
  goals: "Goals",
};

/** Purple = intelligence, green = revenue, blue = finance, orange = action. */
export const CATEGORY_ACCENTS: Record<SignalCategory, string> = {
  money: "bg-blue-500/12 text-blue-500",
  crm: "bg-violet-500/12 text-violet-400",
  business: "bg-emerald-500/12 text-emerald-400",
  goals: "bg-orange-500/12 text-orange-400",
};

export const PRIORITY_ORDER: Record<SignalPriority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export const PRIORITY_STYLES: Record<SignalPriority, string> = {
  critical: "border-rose-400/25 bg-rose-400/10 text-rose-200",
  high: "border-orange-300/25 bg-orange-300/10 text-orange-200",
  medium: "border-blue-300/20 bg-blue-300/10 text-blue-200",
  low: "border-white/15 bg-white/5 text-slate-300",
};

export const MAX_FEED_SIGNALS = 6;
export const MAX_PRIORITIES = 3;
