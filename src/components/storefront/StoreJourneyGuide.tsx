import { Link } from "@tanstack/react-router";
import { ClipboardCheck, PackageCheck, Search } from "lucide-react";

const STEPS = [
  {
    icon: Search,
    eyebrow: "01",
    title: "Choose your gear",
    copy: "Browse the catalogue and select the current size or colour where options are available.",
    to: "/shop/products" as const,
  },
  {
    icon: ClipboardCheck,
    eyebrow: "02",
    title: "Review your order",
    copy: "Confirm your contact, delivery and payment details before placing the order.",
    to: "/shop/checkout" as const,
  },
  {
    icon: PackageCheck,
    eyebrow: "03",
    title: "Track the next step",
    copy: "Keep your order number and use the tracking page when you need an update.",
    to: "/shop/track" as const,
  },
];

export function StoreJourneyGuide() {
  return (
    <section className="mt-12 overflow-hidden rounded-3xl border bg-card">
      <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-center">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            A simpler way to shop
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
            From first look to order update.
          </h2>
          <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted-foreground">
            DailyGear keeps the essentials visible: choose the right option, review the order and
            know where to find help after checkout.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {STEPS.map((step) => (
            <Link
              key={step.eyebrow}
              to={step.to}
              className="group rounded-2xl border bg-background p-4 transition-colors hover:border-primary/60 hover:bg-muted/40"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
                  <step.icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="text-xs font-bold tracking-[0.16em] text-muted-foreground">
                  {step.eyebrow}
                </span>
              </div>
              <h3 className="mt-4 text-sm font-semibold group-hover:text-primary">{step.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{step.copy}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
