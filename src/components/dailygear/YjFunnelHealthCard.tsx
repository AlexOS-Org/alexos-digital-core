import { Link } from "@tanstack/react-router";
import { ArrowUpRight, BarChart3, CheckCircle2, CircleAlert } from "lucide-react";
import { useMemo } from "react";
import type { Funnel, Order } from "@/lib/dailygear/types";
import { DG_CURRENCY } from "@/lib/dailygear/constants";

const YJ_FUNNEL_SLUG = "children-school-backpack-blue-46-32-16";

function money(value: number) {
  return `${DG_CURRENCY} ${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export function YjFunnelHealthCard({ funnels, orders }: { funnels: Funnel[]; orders: Order[] }) {
  const health = useMemo(() => {
    const funnel = funnels.find((candidate) => candidate.slug === YJ_FUNNEL_SLUG);
    const funnelOrders = funnel ? orders.filter((order) => order.funnel_id === funnel.id) : [];
    const revenue = funnelOrders.reduce((sum, order) => sum + Number(order.total ?? 0), 0);
    return { funnel, orderCount: funnelOrders.length, revenue };
  }, [funnels, orders]);

  const published = health.funnel?.status === "published";

  return (
    <section className="relative overflow-hidden rounded-[1.35rem] border border-border/70 bg-card/90 p-4 shadow-[0_18px_48px_-30px_var(--alexos-glow)] sm:p-5">
      <span className="alexos-visual-strip absolute inset-x-0 top-0 h-1 opacity-90" />
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
            Funnel health
          </p>
          <h2 className="mt-1 text-xl font-bold tracking-tight">YJ School Bag</h2>
          <p className="mt-1 text-xs text-muted-foreground">Site-owned conversion signals only</p>
        </div>
        <BarChart3 className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <div className="rounded-xl border border-border/60 bg-background/50 px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Status</p>
          <p className="mt-1 flex items-center gap-1 text-sm font-bold">
            {published ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <CircleAlert className="h-3.5 w-3.5 text-amber-500" />
            )}
            {health.funnel ? health.funnel.status : "Not found"}
          </p>
        </div>
        <div className="rounded-xl border border-border/60 bg-background/50 px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Orders</p>
          <p className="mt-1 text-sm font-bold tabular-nums">{health.orderCount}</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-background/50 px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Revenue</p>
          <p className="mt-1 text-sm font-bold tabular-nums">{money(health.revenue)}</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-background/50 px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Sessions</p>
          <p className="mt-1 text-sm font-bold">N/A</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-3">
        <p className="max-w-xl text-xs leading-5 text-muted-foreground">
          Conversion rate remains N/A until captured checkout sessions are stored. Meta acquisition
          metrics stay unavailable until scoped Insights data returns.
        </p>
        <div className="flex items-center gap-3 text-xs font-semibold">
          <Link
            to="/e-commerce/funnels"
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            Manage funnel <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            to="/funnel/$slug"
            params={{ slug: YJ_FUNNEL_SLUG }}
            target="_blank"
            className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
          >
            Preview <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
