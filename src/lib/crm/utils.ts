import type { Contact } from "./types";
import { ALEXOS_LOCALE } from "@/lib/locale";

export function contactDisplayName(
  c: Pick<Contact, "first_name" | "last_name"> | null | undefined,
): string {
  if (!c) return "Unknown";
  return [c.first_name, c.last_name].filter(Boolean).join(" ").trim() || "Unnamed";
}

export function contactInitials(
  c: Pick<Contact, "first_name" | "last_name"> | null | undefined,
): string {
  if (!c) return "?";
  const f = (c.first_name ?? "").trim();
  const l = (c.last_name ?? "").trim();
  return ((f[0] ?? "") + (l[0] ?? "")).toUpperCase() || (f[0] ?? "?").toUpperCase();
}

export function formatCurrency(value: number, currency = "KES"): string {
  return new Intl.NumberFormat(ALEXOS_LOCALE, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}
