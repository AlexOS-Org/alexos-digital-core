import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { Boxes, DollarSign, Percent, ShoppingCart, TrendingUp, Users } from "lucide-react";
import { KpiCard } from "@/components/dailygear/KpiCard";
import { IntelligencePanel } from "@/components/dailygear/IntelligencePanel";
import { Button } from "@/components/ui/button";
import {
  ActivityTimeline,
  BusinessCalendar,
  CustomerInsightsPanel,
  InventoryMonitor,
  LiveOrderFeed,
  NotificationsPanel,
  RecommendationsPanel,
} from "@/components/dailygear/dashboard/DashboardPanels";
import {
  MarketingAnalytics,
  MetaAnalyticsPanel,
  OrderVolumeChart,
  RevenueAnalytics,
} from "@/components/dailygear/dashboard/DashboardCharts";
import { QuickActionsGrid } from "@/components/dailygear/dashboard/QuickActionsGrid";
import { useCommerceData } from "@/lib/dailygear/useCommerceData";
import { computeKpis, computeTrend } from "@/lib/dailygear/calculations";
import { DG_CURRENCY } from "@/lib/dailygear/constants";
import { useDeviceTier } from "@/hooks/use-device-tier";

export const Route = createFileRoute("/_authenticated/e-commerce/")({
  head: () => ({
    meta: [
      { title: "DailyGear Commerce Overview | Alex OS" },
      {
        name: "description",
        content: "Revenue, profit, order and inventory KPIs for your DailyGear commerce operation.",
      },
      { property: "og:title", content: "DailyGear Commerce Overview | Alex OS" },
      {
        property: "og:description",
        content: "Revenue, profit, order and inventory KPIs for your commerce operation.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CommerceOverview,
});

const money = (v: number) =>
  `${DG_CURRENCY} ${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

const compact = (v: number) =>
  `${DG_CURRENCY} ${Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(v)}`;

function CommerceOverview() {
  const tier = useDeviceTier();
  const { products, orders, orderItems, customers, movements, context, isLoading } =
    useCommerceData();

  const kpis = useMemo(
    () => computeKpis(orders, orderItems, products, customers),
    [orders, orderItems, products, customers],
  );
  const trend = useMemo(() => computeTrend(orders, orderItems), [orders, orderItems]);

  const panels = {
    orders,
    orderItems,
    products,
    customers,
    movements,
    trend,
    kpis,
    loading: isLoading,
  };

  if (tier === "mobile") return <MobileDashboard {...panels} ctx={context} />;
  if (tier === "ultrawide" || tier === "desktop")
    return <WideDashboard {...panels} ctx={context} dense={tier === "ultrawide"} />;
  return <StandardDashboard {...panels} ctx={context} tablet={tier === "tablet"} />;
}

type Panels = {
  orders: ReturnType<typeof useCommerceData>["orders"];
  orderItems: ReturnType<typeof useCommerceData>["orderItems"];
  products: ReturnType<typeof useCommerceData>["products"];
  customers: ReturnType<typeof useCommerceData>["customers"];
  movements: ReturnType<typeof useCommerceData>["movements"];
  trend: ReturnType<typeof computeTrend>;
  kpis: ReturnType<typeof computeKpis>;
  loading: boolean;
  ctx: ReturnType<typeof useCommerceData>["context"];
};

/* ── Shared header ───────────────────────────────────────────── */

function Hero({ kpis, compactMode }: { kpis: Panels["kpis"]; compactMode?: boolean }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <section className="rise-in overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-primary/[0.10] via-card to-card p-5 soft-shadow sm:p-7">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:flex-wrap sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            DailyGear commerce
          </p>
          <h1 className="mt-1 truncate text-xl font-black tracking-tight sm:text-3xl">
            {greeting}, here is your store
          </h1>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            {new Date().toLocaleDateString(undefined, {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
        </div>
        {!compactMode && (
          <div className="flex shrink-0 gap-2">
            <Button asChild variant="outline" className="rounded-xl">
              <Link to="/e-commerce/store">Store preview</Link>
            </Button>
            <Button asChild className="rounded-xl">
              <Link to="/e-commerce/checkout">New order</Link>
            </Button>
          </div>
        )}
      </div>

      {compactMode && (
        <div className="mt-5 grid grid-cols-2 gap-3">
          <MiniStat label="Revenue 30d" value={compact(kpis.revenue)} />
          <MiniStat label="Profit 30d" value={compact(kpis.profit)} />
          <MiniStat label="Orders" value={String(kpis.orders)} />
          <MiniStat label="Pending" value={String(kpis.pendingOrders)} />
        </div>
      )}
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-card/70 px-3.5 py-3 backdrop-blur">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-lg font-bold tabular-nums">{value}</p>
    </div>
  );
}

function KpiWall({ kpis, loading }: { kpis: Panels["kpis"]; loading: boolean }) {
  return (
    <>
      <KpiCard
        label="Revenue (30d)"
        value={money(kpis.revenue)}
        icon={DollarSign}
        changePct={kpis.revenueChangePct}
        loading={loading}
      />
      <KpiCard
        label="Gross profit"
        value={money(kpis.profit)}
        icon={TrendingUp}
        tone="positive"
        loading={loading}
      />
      <KpiCard
        label="Orders (30d)"
        value={kpis.orders}
        icon={ShoppingCart}
        changePct={kpis.ordersChangePct}
        hint={`${kpis.pendingOrders} awaiting fulfilment`}
        loading={loading}
      />
      <KpiCard
        label="Inventory value"
        value={money(kpis.inventoryValue)}
        icon={Boxes}
        tone={kpis.lowStockCount ? "warning" : "default"}
        hint={`${kpis.lowStockCount} low-stock items`}
        loading={loading}
      />
      <KpiCard
        label="Average order value"
        value={money(kpis.averageOrderValue)}
        icon={DollarSign}
        loading={loading}
      />
      <KpiCard
        label="Customers"
        value={kpis.customers}
        icon={Users}
        hint={`${kpis.returningCustomers} returning`}
        loading={loading}
      />
      <KpiCard
        label="Delivered orders"
        value={kpis.deliveredOrders}
        icon={ShoppingCart}
        tone="positive"
        loading={loading}
      />
      <KpiCard
        label="Purchase rate"
        value={`${kpis.conversionRate.toFixed(0)}%`}
        icon={Percent}
        hint="Customers who have ordered"
        loading={loading}
      />
    </>
  );
}

/* ── Mobile: app-style stacked experience ────────────────────── */

function MobileDashboard(p: Panels) {
  return (
    <div className="space-y-4 pb-40">
      <Hero kpis={p.kpis} compactMode />

      <section className="-mx-4 px-4">
        <div className="swipe-row no-scrollbar gap-3 pb-1">
          {[
            { label: "AOV", value: compact(p.kpis.averageOrderValue) },
            { label: "Customers", value: String(p.kpis.customers) },
            { label: "Inventory", value: compact(p.kpis.inventoryValue) },
            { label: "Low stock", value: String(p.kpis.lowStockCount) },
            { label: "Delivered", value: String(p.kpis.deliveredOrders) },
            { label: "Purchase rate", value: `${p.kpis.conversionRate.toFixed(0)}%` },
          ].map((s) => (
            <div
              key={s.label}
              className="w-36 rounded-2xl border border-border/60 bg-card px-4 py-3 soft-shadow"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {s.label}
              </p>
              <p className="mt-1 text-base font-bold tabular-nums">{s.value}</p>
            </div>
          ))}
        </div>
      </section>

      <QuickActionsGrid columns={4} />
      <RevenueAnalytics trend={p.trend} loading={p.loading} height={180} />
      <LiveOrderFeed orders={p.orders} customers={p.customers} loading={p.loading} limit={4} />
      <NotificationsPanel products={p.products} orders={p.orders} loading={p.loading} />
      <InventoryMonitor products={p.products} loading={p.loading} limit={3} />
      <RecommendationsPanel products={p.products} orders={p.orders} loading={p.loading} />
      <ActivityTimeline
        orders={p.orders}
        movements={p.movements}
        customers={p.customers}
        loading={p.loading}
        limit={5}
      />
    </div>
  );
}

/* ── Tablet & laptop: multi-column productivity ──────────────── */

function StandardDashboard(p: Panels & { tablet?: boolean }) {
  return (
    <div className="space-y-5">
      <Hero kpis={p.kpis} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiWall kpis={p.kpis} loading={p.loading} />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <RevenueAnalytics trend={p.trend} loading={p.loading} height={p.tablet ? 220 : 280} />
        </div>
        <MarketingAnalytics orders={p.orders} loading={p.loading} height={p.tablet ? 220 : 280} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <LiveOrderFeed orders={p.orders} customers={p.customers} loading={p.loading} />
        <InventoryMonitor products={p.products} loading={p.loading} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <CustomerInsightsPanel customers={p.customers} orders={p.orders} loading={p.loading} />
        <RecommendationsPanel products={p.products} orders={p.orders} loading={p.loading} />
        <NotificationsPanel products={p.products} orders={p.orders} loading={p.loading} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ActivityTimeline
            orders={p.orders}
            movements={p.movements}
            customers={p.customers}
            loading={p.loading}
          />
        </div>
        <BusinessCalendar orders={p.orders} />
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold tracking-tight">Operating signals</h2>
        <IntelligencePanel kind="market" ctx={p.ctx} ready={!p.loading} />
      </section>
    </div>
  );
}

/* ── Desktop 1920 & 4K: executive command wall ───────────────── */

function WideDashboard(p: Panels & { dense?: boolean }) {
  return (
    <div className="space-y-6">
      <Hero kpis={p.kpis} />

      <div className={p.dense ? "grid gap-5 grid-cols-8" : "grid gap-5 grid-cols-4"}>
        <KpiWall kpis={p.kpis} loading={p.loading} />
      </div>

      <div className={p.dense ? "grid gap-5 grid-cols-12" : "grid gap-5 grid-cols-8"}>
        <div className={p.dense ? "col-span-5" : "col-span-4"}>
          <RevenueAnalytics trend={p.trend} loading={p.loading} height={320} />
        </div>
        <div className={p.dense ? "col-span-3" : "col-span-2"}>
          <OrderVolumeChart trend={p.trend} loading={p.loading} height={320} />
        </div>
        <div className={p.dense ? "col-span-2" : "col-span-2"}>
          <MarketingAnalytics orders={p.orders} loading={p.loading} height={320} />
        </div>
        {p.dense && (
          <div className="col-span-2">
            <MetaAnalyticsPanel />
          </div>
        )}
      </div>

      <div className={p.dense ? "grid gap-5 grid-cols-12" : "grid gap-5 grid-cols-6"}>
        <div className={p.dense ? "col-span-4" : "col-span-3"}>
          <LiveOrderFeed
            orders={p.orders}
            customers={p.customers}
            loading={p.loading}
            limit={p.dense ? 10 : 7}
          />
        </div>
        <div className={p.dense ? "col-span-3" : "col-span-3"}>
          <InventoryMonitor products={p.products} loading={p.loading} limit={p.dense ? 8 : 6} />
        </div>
        <div className={p.dense ? "col-span-3" : "col-span-3"}>
          <CustomerInsightsPanel
            customers={p.customers}
            orders={p.orders}
            loading={p.loading}
            limit={p.dense ? 8 : 5}
          />
        </div>
        <div className={p.dense ? "col-span-2" : "col-span-3"}>
          <NotificationsPanel products={p.products} orders={p.orders} loading={p.loading} />
        </div>
      </div>

      <div className={p.dense ? "grid gap-5 grid-cols-12" : "grid gap-5 grid-cols-6"}>
        <div className={p.dense ? "col-span-4" : "col-span-3"}>
          <ActivityTimeline
            orders={p.orders}
            movements={p.movements}
            customers={p.customers}
            loading={p.loading}
            limit={p.dense ? 12 : 8}
          />
        </div>
        <div className={p.dense ? "col-span-3" : "col-span-3"}>
          <RecommendationsPanel products={p.products} orders={p.orders} loading={p.loading} />
        </div>
        <div className={p.dense ? "col-span-3" : "col-span-3"}>
          <BusinessCalendar orders={p.orders} />
        </div>
        <div className={p.dense ? "col-span-2" : "col-span-3"}>
          <QuickActionsGrid columns={2} />
        </div>
      </div>

      {!p.dense && (
        <div className="grid gap-5 grid-cols-3">
          <MetaAnalyticsPanel />
          <div className="col-span-2">
            <IntelligencePanel kind="marketing" ctx={p.ctx} ready={!p.loading} />
          </div>
        </div>
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold tracking-tight">Operating signals</h2>
        <IntelligencePanel kind="market" ctx={p.ctx} ready={!p.loading} />
      </section>
    </div>
  );
}
