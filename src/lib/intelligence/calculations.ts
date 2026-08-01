import { formatMoney } from "@/lib/money/format";

export function formatPct(value: number, digits = 0) {
  return `${value >= 0 ? "" : "-"}${Math.abs(value).toFixed(digits)}%`;
}

export function formatAmount(value: number) {
  return formatMoney(value);
}

export function relativeTime(iso: string, now = new Date()) {
  const diff = now.getTime() - new Date(iso).getTime();
  const mins = Math.round(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function plural(count: number, singular: string, pluralForm = `${singular}s`) {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}
