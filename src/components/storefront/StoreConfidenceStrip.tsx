import { Link } from "@tanstack/react-router";
import { FileCheck2, LockKeyhole, MessageCircle } from "lucide-react";

const ITEMS = [
  {
    icon: LockKeyhole,
    title: "Clear checkout",
    copy: "Review your order and payment method before placing it.",
    to: "/shop/checkout" as const,
  },
  {
    icon: FileCheck2,
    title: "Track your order",
    copy: "Use your order number and checkout contact details to check progress.",
    to: "/shop/track" as const,
  },
  {
    icon: MessageCircle,
    title: "Support when needed",
    copy: "Find contact details, FAQs, delivery and returns guidance in one place.",
    to: "/shop/contact" as const,
  },
];

export function StoreConfidenceStrip({ compact = false }: { compact?: boolean }) {
  return (
    <section
      aria-label="Shopping confidence"
      className={`grid gap-3 sm:grid-cols-3 ${compact ? "mt-5" : "mt-10"}`}
    >
      {ITEMS.map((item) => (
        <Link
          key={item.title}
          to={item.to}
          className="group flex items-start gap-3 rounded-2xl border bg-card p-4 transition-colors hover:border-primary/60 hover:bg-muted/40"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <item.icon className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold group-hover:text-primary">
              {item.title}
            </span>
            <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
              {item.copy}
            </span>
          </span>
        </Link>
      ))}
    </section>
  );
}
