import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  Bell,
  CalendarDays,
  CheckCircle2,
  Crown,
  PackageSearch,
  Radio,
  Sparkles,
  Truck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/dailygear/StatusBadge";
import { computeCustomerInsights, reorderSuggestions } from "@/lib/dailygear/calculations";
import type { Customer, Order, Product, StockMovement } from "@/lib/dailygear/types";
import { DG_CURRENCY, ORDER_STATUS_META } from "@/lib/dailygear/constants";
import { cn } from "@/lib/utils";

const money = (v: number) =>
  `${DG_CURRENCY} ${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

const when = (iso: string | null) => {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
};

function PanelShell({
  title,
  icon: Icon,
  action,
  children,
  className,
}: {
  title: string;
  icon: typeof Activity;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("h-full rounded-3xl border-border/60 soft-shadow", className)}>
      <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
        <CardTitle className="flex min-w-0 items-center gap-2 text-sm font-semibold">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <Icon className="h-3.5 w-3.5" />
          </span>
          <span className="truncate">{title}</span>
        </CardTitle>
        {action}
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  );
}

function EmptyRow({ label }: { label: string }) {
  return (
    <p className="rounded-2xl border border-dashed border-border/70 px-4 py-8 text-center text-xs text-muted-foreground">
      {label}
    </p>
  );
}

function Loading({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 rounded-2xl" />
      ))}
    </div>
  );
}

/* ── Live order feed ──────────────────────────────────────────── */

export function LiveOrderFeed({
  orders,
  customers,
  loading,
  limit = 6,
}: {
  orders: Order[];
  customers: Customer[];
  loading?: boolean;
  limit?: number;
}) {
  const names = useMemo(
    () =>
      new Map(customers.map((c) => [c.id, [c.first_name, c.last_name].filter(Boolean).join(" ")])),
    [customers],
  );

  const rows = useMemo(
    () =>
      [...orders].sort((a, b) => +new Date(b.placed_at) - +new Date(a.placed_at)).slice(0, limit),
    [orders, limit],
  );

  return (
    <PanelShell
      title="Live order feed"
      icon={Radio}
      action={
        <Link
          to="/e-commerce/orders"
          className="shrink-0 text-xs font-medium text-primary hover:underline"
        >
          All orders
        </Link>
      }
    >
      {loading ? (
        <Loading />
      ) : rows.length === 0 ? (
        <EmptyRow label="No orders yet. New orders stream in here as they are placed." />
      ) : (
        <ul className="space-y-1.5">
          {rows.map((o) => (
            <li
              key={o.id}
              className="flex items-center justify-between gap-3 rounded-2xl px-3 py-2.5 transition-colors hover:bg-muted/60"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {o.customer_id ? (names.get(o.customer_id) ?? "Customer") : "Guest"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {o.order_number} · {when(o.placed_at)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-sm font-semibold tabular-nums">{money(Number(o.total))}</span>
                <StatusBadge meta={ORDER_STATUS_META[o.status]} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </PanelShell>
  );
}

/* ── Activity timeline ───────────────────────────────────────── */

export function ActivityTimeline({
  orders,
  movements,
  customers,
  loading,
  limit = 8,
}: {
  orders: Order[];
  movements: StockMovement[];
  customers: Customer[];
  loading?: boolean;
  limit?: number;
}) {
  const events = useMemo(() => {
    const list: Array<{ id: string; at: string; label: string; detail: string; tone: string }> = [];

    for (const o of orders) {
      list.push({
        id: `o-${o.id}`,
        at: o.placed_at,
        label: `Order ${o.order_number}`,
        detail: `${money(Number(o.total))} · ${o.status}`,
        tone: "bg-primary",
      });
    }
    for (const m of movements) {
      list.push({
        id: `m-${m.id}`,
        at: m.occurred_at,
        label: `Stock ${m.type}`,
        detail: `${Number(m.quantity) > 0 ? "+" : ""}${m.quantity} units`,
        tone: "bg-chart-4",
      });
    }
    for (const c of customers) {
      list.push({
        id: `c-${c.id}`,
        at: c.created_at,
        label: "New customer",
        detail: [c.first_name, c.last_name].filter(Boolean).join(" "),
        tone: "bg-chart-2",
      });
    }

    return list.sort((a, b) => +new Date(b.at) - +new Date(a.at)).slice(0, limit);
  }, [orders, movements, customers, limit]);

  return (
    <PanelShell title="Activity timeline" icon={Activity}>
      {loading ? (
        <Loading rows={5} />
      ) : events.length === 0 ? (
        <EmptyRow label="Activity across orders, stock and customers appears here." />
      ) : (
        <ol className="relative space-y-4 border-l border-border/70 pl-5">
          {events.map((e) => (
            <li key={e.id} className="relative">
              <span
                className={cn(
                  "absolute -left-[1.4rem] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-card",
                  e.tone,
                )}
              />
              <p className="text-sm font-medium leading-tight">{e.label}</p>
              <p className="text-xs text-muted-foreground">
                {e.detail} · {when(e.at)}
              </p>
            </li>
          ))}
        </ol>
      )}
    </PanelShell>
  );
}

/* ── Inventory monitoring ────────────────────────────────────── */

export function InventoryMonitor({
  products,
  loading,
  limit = 6,
}: {
  products: Product[];
  loading?: boolean;
  limit?: number;
}) {
  const rows = useMemo(() => reorderSuggestions(products).slice(0, limit), [products, limit]);

  return (
    <PanelShell
      title="Inventory monitoring"
      icon={PackageSearch}
      action={
        <Link
          to="/e-commerce/inventory"
          className="shrink-0 text-xs font-medium text-primary hover:underline"
        >
          Manage
        </Link>
      }
    >
      {loading ? (
        <Loading />
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <CheckCircle2 className="h-6 w-6 text-success" />
          <p className="text-xs text-muted-foreground">Every product is above its reorder point.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map(({ product, suggestedQuantity }) => {
            const threshold = Math.max(Number(product.low_stock_threshold), 1);
            const pct = Math.min((Number(product.stock_quantity) / threshold) * 100, 100);
            return (
              <li key={product.id} className="space-y-1.5">
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate text-sm font-medium">{product.name}</span>
                  <Badge variant="secondary" className="shrink-0 text-[11px]">
                    reorder {suggestedQuantity}
                  </Badge>
                </div>
                <Progress value={pct} className="h-1.5" />
                <p className="text-[11px] text-muted-foreground">
                  {product.stock_quantity} in stock · threshold {product.low_stock_threshold}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </PanelShell>
  );
}

/* ── Customer insights ───────────────────────────────────────── */

export function CustomerInsightsPanel({
  customers,
  orders,
  loading,
  limit = 5,
}: {
  customers: Customer[];
  orders: Order[];
  loading?: boolean;
  limit?: number;
}) {
  const rows = useMemo(
    () => computeCustomerInsights(customers, orders).slice(0, limit),
    [customers, orders, limit],
  );

  return (
    <PanelShell
      title="Top customers by lifetime value"
      icon={Crown}
      action={
        <Link
          to="/e-commerce/customers"
          className="shrink-0 text-xs font-medium text-primary hover:underline"
        >
          CRM
        </Link>
      }
    >
      {loading ? (
        <Loading />
      ) : rows.length === 0 ? (
        <EmptyRow label="Customer lifetime value builds as orders are recorded." />
      ) : (
        <ul className="space-y-1.5">
          {rows.map(({ customer, orders: count, lifetimeValue, lastOrderAt }) => (
            <li
              key={customer.id}
              className="flex items-center justify-between gap-3 rounded-2xl px-3 py-2.5 hover:bg-muted/60"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {[customer.first_name, customer.last_name].filter(Boolean).join(" ")}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {count} orders · last {when(lastOrderAt)}
                </p>
              </div>
              <span className="shrink-0 text-sm font-semibold tabular-nums">
                {money(lifetimeValue)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </PanelShell>
  );
}

/* ── Notifications ───────────────────────────────────────────── */

export function NotificationsPanel({
  products,
  orders,
  loading,
}: {
  products: Product[];
  orders: Order[];
  loading?: boolean;
}) {
  const items = useMemo(() => {
    const list: Array<{ id: string; icon: typeof Bell; text: string; tone: string }> = [];
    const low = products.filter(
      (p) => Number(p.stock_quantity) <= Number(p.low_stock_threshold),
    ).length;
    const pending = orders.filter((o) => ["new", "processing"].includes(o.status)).length;
    const unpaid = orders.filter((o) => o.payment_status === "unpaid").length;
    const shipping = orders.filter((o) => ["packed", "shipped"].includes(o.status)).length;

    if (low)
      list.push({
        id: "low",
        icon: AlertTriangle,
        text: `${low} product${low > 1 ? "s" : ""} at or below reorder point`,
        tone: "text-destructive",
      });
    if (pending)
      list.push({
        id: "pending",
        icon: Bell,
        text: `${pending} order${pending > 1 ? "s" : ""} awaiting fulfilment`,
        tone: "text-chart-4",
      });
    if (unpaid)
      list.push({
        id: "unpaid",
        icon: Bell,
        text: `${unpaid} order${unpaid > 1 ? "s" : ""} still unpaid`,
        tone: "text-chart-4",
      });
    if (shipping)
      list.push({
        id: "shipping",
        icon: Truck,
        text: `${shipping} shipment${shipping > 1 ? "s" : ""} in transit`,
        tone: "text-primary",
      });

    return list;
  }, [products, orders]);

  return (
    <PanelShell title="Notifications" icon={Bell}>
      {loading ? (
        <Loading rows={3} />
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <CheckCircle2 className="h-6 w-6 text-success" />
          <p className="text-xs text-muted-foreground">All clear — nothing needs attention.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((n) => (
            <li
              key={n.id}
              className="flex items-start gap-3 rounded-2xl bg-muted/50 px-3 py-2.5 text-sm"
            >
              <n.icon className={cn("mt-0.5 h-4 w-4 shrink-0", n.tone)} />
              <span className="min-w-0">{n.text}</span>
            </li>
          ))}
        </ul>
      )}
    </PanelShell>
  );
}

/* ── AI recommendations ──────────────────────────────────────── */

export function RecommendationsPanel({
  products,
  orders,
  loading,
}: {
  products: Product[];
  orders: Order[];
  loading?: boolean;
}) {
  const tips = useMemo(() => {
    const list: string[] = [];
    const low = reorderSuggestions(products);
    if (low[0])
      list.push(
        `Restock “${low[0].product.name}” — ${low[0].suggestedQuantity} units restores healthy cover.`,
      );
    const pending = orders.filter((o) => ["new", "processing"].includes(o.status));
    if (pending.length >= 3)
      list.push(`${pending.length} orders are queued — batch-pack them to protect delivery SLAs.`);
    const noImage = products.filter((p) => (p.images ?? []).length === 0);
    if (noImage.length)
      list.push(
        `${noImage.length} products have no imagery — listings without photos convert far worse.`,
      );
    const noSale = products.filter((p) => !p.sale_price).length;
    if (noSale > 5)
      list.push("Run a limited promo on slow movers to unlock trapped working capital.");
    if (!list.length) list.push("Operations look healthy — focus on acquisition this week.");
    return list.slice(0, 4);
  }, [products, orders]);

  return (
    <PanelShell title="Recommendations" icon={Sparkles}>
      {loading ? (
        <Loading rows={3} />
      ) : (
        <ul className="space-y-2">
          {tips.map((t) => (
            <li
              key={t}
              className="rounded-2xl border border-border/60 bg-gradient-to-br from-primary/[0.06] to-transparent px-3.5 py-3 text-sm leading-relaxed"
            >
              {t}
            </li>
          ))}
        </ul>
      )}
    </PanelShell>
  );
}

/* ── Business calendar ───────────────────────────────────────── */

export function BusinessCalendar({ orders }: { orders: Order[] }) {
  const { days, monthLabel } = useMemo(() => {
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    const total = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const counts = new Map<number, number>();

    for (const o of orders) {
      const d = new Date(o.placed_at);
      if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()) {
        counts.set(d.getDate(), (counts.get(d.getDate()) ?? 0) + 1);
      }
    }

    return {
      monthLabel: now.toLocaleDateString(undefined, { month: "long", year: "numeric" }),
      days: [
        ...Array.from({ length: first.getDay() }, () => null),
        ...Array.from({ length: total }, (_, i) => ({
          day: i + 1,
          orders: counts.get(i + 1) ?? 0,
          today: i + 1 === now.getDate(),
        })),
      ],
    };
  }, [orders]);

  return (
    <PanelShell
      title="Business calendar"
      icon={CalendarDays}
      action={<span className="shrink-0 text-xs text-muted-foreground">{monthLabel}</span>}
    >
      <div className="grid grid-cols-7 gap-1 text-center">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <span key={i} className="pb-1 text-[10px] font-medium uppercase text-muted-foreground">
            {d}
          </span>
        ))}
        {days.map((d, i) =>
          d === null ? (
            <span key={`b-${i}`} />
          ) : (
            <span
              key={d.day}
              className={cn(
                "grid aspect-square place-items-center rounded-lg text-xs tabular-nums",
                d.today && "bg-primary font-semibold text-primary-foreground",
                !d.today && d.orders > 0 && "bg-primary/10 font-medium text-primary",
                !d.today && d.orders === 0 && "text-muted-foreground",
              )}
              title={d.orders ? `${d.orders} orders` : undefined}
            >
              {d.day}
            </span>
          ),
        )}
      </div>
    </PanelShell>
  );
}
