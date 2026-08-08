export function formatMoney(amount: number | string | null | undefined, currency = "KES") {
  const n = typeof amount === "string" ? parseFloat(amount) : (amount ?? 0);
  if (!isFinite(n)) return `${currency} 0.00`;
  return `${currency} ${n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(d: string | Date) {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

export function formatTime(d: string | Date) {
  const date = typeof d === "string" ? new Date(d) : d;
  const preference =
    typeof window !== "undefined"
      ? window.localStorage.getItem("alexos-dashboard-time-format")
      : null;
  return date.toLocaleTimeString("en-KE", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: preference === "12h" ? true : false,
  });
}

export function monthKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export function monthLabel(d: string | Date) {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString(undefined, { year: "numeric", month: "long" });
}
