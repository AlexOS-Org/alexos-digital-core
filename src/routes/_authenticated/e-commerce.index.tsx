import { CatalogueReadinessCard } from "@/components/dailygear/dashboard/CatalogueReadinessCard";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Boxes,
  DollarSign,
  Percent,
  ShoppingCart,
  TrendingUp,
  Users,
  WalletCards,
} from "lucide-react";
import { KpiCard } from "@/components/dailygear/KpiCard";
import { IntelligencePanel } from "@/components/dailygear/IntelligencePanel";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
  DashboardChartsBoundary,
} from "@/components/dailygear/dashboard/DashboardChartsLazy";
import { QuickActionsGrid } from "@/components/dailygear/dashboard/QuickActionsGrid";
import { ProfitCashFlowPanel } from "@/components/dailygear/ProfitCashFlowPanel";
import { useCommerceData } from "@/lib/dailygear/useCommerceData";
import { computeKpis, computeTrend } from "@/lib/dailygear/calculations";
import { DG_CURRENCY } from "@/lib/dailygear/constants";
import { useDeviceTier } from "@/hooks/use-device-tier";
import dailyGearMountainWide from "@/assets/visuals/dailygear-mountain-golden-wide.webp";
import dailyGearMountainMobile from "@/assets/visuals/dailygear-mountain-mobile.webp";
import { useLocalWeather } from "@/components/dashboard/greeting-context";
import { useTheme } from "@/components/theme/ThemeProvider";
import { getVisualTheme } from "@/components/theme/visual-themes";
import { getGreetingScene } from "@/components/theme/visual-scenes";
import { getDashboardSceneAsset } from "@/components/theme/dashboard-scene-assets";
import { debtRemaining, useDebts } from "@/lib/debts/api";

export const Route = createFileRoute("/_authenticated/e-commerce/")({
  head: () => ({
    meta: [
      { title: "DailyGear Commerce Overview | AlexOS" },
      {
        name: "description",
        content: "Revenue, profit, order and inventory KPIs for your DailyGear commerce operation.",
      },
      { property: "og:title", content: "DailyGear Commerce Overview | AlexOS" },
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

  if (tier === "mobile") {
    return (
      <DashboardChartsBoundary>
        <MobileDashboard {...panels} ctx={context} />
      </DashboardChartsBoundary>
    );
  }
  if (tier === "ultrawide" || tier === "desktop") {
    return (
      <DashboardChartsBoundary>
        <WideDashboard {...panels} ctx={context} dense={tier === "ultrawide"} />
      </DashboardChartsBoundary>
    );
  }
  return (
    <DashboardChartsBoundary>
      <StandardDashboard {...panels} ctx={context} tablet={tier === "tablet"} />
    </DashboardChartsBoundary>
  );
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
  const [now, setNow] = useState(() => new Date());
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const { visualTheme, dashboardScene, greetingTrigger } = useTheme();
  const selectedVisualTheme = getVisualTheme(visualTheme);
  const localWeather = useLocalWeather();
  const activeScene =
    dashboardScene === "auto"
      ? getGreetingScene(
          greetingTrigger,
          hour,
          selectedVisualTheme.backdrop,
          localWeather.weather
            ? { weatherCode: localWeather.weather.weatherCode, night: localWeather.night }
            : null,
          localWeather.location,
        )
      : dashboardScene;

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  const isSceneImage = activeScene !== "none";
  const sceneAsset = isSceneImage
    ? activeScene === "mountains"
      ? dailyGearMountainWide
      : getDashboardSceneAsset(activeScene)
    : undefined;
  const sceneMobileAsset = isSceneImage
    ? activeScene === "mountains"
      ? dailyGearMountainMobile
      : sceneAsset
    : undefined;

  return (
    <section
      data-atmosphere={
        hour >= 5 && hour < 11
          ? "morning"
          : hour >= 11 && hour < 17
            ? "day"
            : hour >= 17 && hour < 21
              ? "evening"
              : "night"
      }
      data-scene={activeScene}
      className="dashboard-hero-frame dailygear-workspace-hero rise-in relative overflow-hidden rounded-[1.75rem] p-5 text-white sm:p-7"
    >
      {isSceneImage ? (
        <picture className="pointer-events-none absolute inset-0 z-0 block">
          <source media="(max-width: 640px)" srcSet={sceneMobileAsset} />
          <img
            src={sceneAsset}
            alt=""
            aria-hidden="true"
            decoding="async"
            className="h-full w-full object-cover opacity-55"
          />
        </picture>
      ) : null}
      <div className="dailygear-hero-overlay pointer-events-none absolute inset-0 z-[1]" />
      <div className="dailygear-hero-grid pointer-events-none absolute inset-0 z-[1]" />
      <div className="dailygear-hero-orb pointer-events-none absolute -right-10 -top-12 z-[1] h-40 w-40 rounded-full blur-2xl" />
      <div className="relative z-10 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:flex-wrap sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            DailyGear commerce
          </p>
          <h1 className="mt-1 truncate text-xl font-black tracking-tight sm:text-3xl">
            {compactMode ? `${greeting}, Alex` : `${greeting}, here is your store`}
          </h1>
          <p className="mt-1 text-xs text-white/70 sm:text-sm">
            {compactMode
              ? "Here\u0027s what\u0027s happening with DailyGear today."
              : new Date().toLocaleDateString(undefined, {
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
      {!compactMode && (
        <div className="relative z-10 mt-6 grid max-w-2xl grid-cols-3 gap-2 sm:gap-3">
          <HeroMetric label="Revenue · 30d" value={money(kpis.revenue)} />
          <HeroMetric label="Orders · 30d" value={String(kpis.orders)} />
          <HeroMetric label="Inventory value" value={money(kpis.inventoryValue)} />
        </div>
      )}
    </section>
  );
}

function FacebookAdsBalanceCard() {
  const { data: debts = [], isLoading } = useDebts();
  const balances = debts.filter((debt) => {
    if (debt.financial_scope !== "business") return false;
    const searchable =
      `${debt.name} ${debt.category ?? ""} ${debt.business_name ?? ""}`.toLowerCase();
    return (
      searchable.includes("facebook") ||
      searchable.includes("meta ads") ||
      searchable.includes("advertising")
    );
  });
  const remaining = balances.reduce((sum, debt) => sum + debtRemaining(debt), 0);
  const isSettled = balances.length > 0 && remaining <= 0;
  return (
    <section
      data-status={isSettled ? "paid" : balances.length === 0 ? "unconfigured" : "outstanding"}
      className="dailygear-liability-card relative overflow-hidden rounded-[1.35rem] border p-4 sm:p-5"
    >
      <span className="dailygear-liability-strip absolute inset-x-0 top-0 h-1" />
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Facebook advertising balance
          </p>
          <h2 className="mt-1 text-lg font-bold tracking-tight">
            {isLoading ? "Loading…" : money(remaining)}
          </h2>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {balances.length === 0
              ? "Add a business debt named Facebook Ads to track this separately from operating cash."
              : isSettled
                ? "Settled. This tracker does not post to operating accounts."
                : "Tracked liability only; record payments in Debt Management to reduce the balance."}
          </p>
        </div>
        <div className="dailygear-liability-icon grid h-10 w-10 shrink-0 place-items-center rounded-xl">
          <WalletCards className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="dailygear-liability-status rounded-full px-2.5 py-1 text-[11px] font-semibold">
          {isSettled ? "Paid" : balances.length === 0 ? "Not configured" : "Outstanding"}
        </span>
        <Button asChild variant="outline" size="sm" className="rounded-xl">
          <Link to="/debt-management">Manage balance</Link>
        </Button>
      </div>
    </section>
  );
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/[0.08] px-3 py-2.5 shadow-inner shadow-white/[0.04] backdrop-blur-md">
      <p className="truncate text-[9px] font-semibold uppercase tracking-[0.14em] text-white/60">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-black tabular-nums text-white sm:text-base">
        {value}
      </p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.08] px-3.5 py-3 shadow-inner shadow-white/[0.04] backdrop-blur-md">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-white/60">{label}</p>
      <p className="mt-0.5 text-lg font-bold tabular-nums text-white">{value}</p>
    </div>
  );
}

function buildSparklinePath(trend: Panels["trend"]) {
  const values = trend.map((point) => Number(point.revenue));
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = Math.max(max - min, 1);
  const denominator = Math.max(values.length - 1, 1);

  return values
    .map((value, index) => {
      const x = (index / denominator) * 100;
      const y = 42 - ((value - min) / span) * 34;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function MobileStoreOverview({ kpis, trend, loading }: Pick<Panels, "kpis" | "trend" | "loading">) {
  const comparison =
    Number.isFinite(kpis.revenueChangePct) && kpis.revenueChangePct !== 0
      ? `${kpis.revenueChangePct > 0 ? "↑" : "↓"} ${Math.abs(kpis.revenueChangePct).toFixed(1)}% vs comparison`
      : "No comparable baseline";

  return (
    <section className="relative overflow-hidden rounded-[1.75rem] border border-border/70 bg-card/90 p-4 shadow-[0_18px_48px_-30px_var(--alexos-glow)] sm:p-5">
      <span className="alexos-visual-strip absolute inset-x-0 top-0 h-1 opacity-90" />
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
            Store overview
          </p>
          <h2 className="mt-1 text-xl font-bold tracking-tight">Sales you can see.</h2>
        </div>
        <Link
          to="/e-commerce/reports"
          className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          View analytics <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="mt-4 rounded-2xl border border-border/60 bg-background/55 p-3.5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Total sales · last 30 days
            </p>
            <p className="mt-1 text-2xl font-black tabular-nums">{money(kpis.revenue)}</p>
            <p
              className={`mt-1 text-xs font-semibold ${kpis.revenueChangePct > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}
            >
              {comparison}
            </p>
          </div>
          <div className="h-16 w-[48%] min-w-32">
            {loading ? (
              <Skeleton className="h-full w-full rounded-xl" />
            ) : trend.length > 0 ? (
              <svg
                viewBox="0 0 100 48"
                className="h-full w-full overflow-visible"
                role="img"
                aria-label="Revenue trend"
              >
                <defs>
                  <linearGradient id="dg-mobile-revenue" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0" stopColor="var(--color-chart-1)" stopOpacity="0.3" />
                    <stop offset="1" stopColor="var(--color-chart-1)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d={`${buildSparklinePath(trend)} L 100 48 L 0 48 Z`}
                  fill="url(#dg-mobile-revenue)"
                />
                <path
                  d={buildSparklinePath(trend)}
                  fill="none"
                  stroke="var(--color-chart-1)"
                  strokeWidth="1.8"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            ) : (
              <div className="grid h-full place-items-center rounded-xl border border-dashed border-border/70 text-[10px] text-muted-foreground">
                No sales trend yet
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2.5">
        <MiniStat label="Orders" value={String(kpis.orders)} />
        <MiniStat label="Customers" value={String(kpis.customers)} />
        <MiniStat label="Purchase rate" value={`${kpis.conversionRate.toFixed(0)}%`} />
        <MiniStat label="Average order" value={compact(kpis.averageOrderValue)} />
      </div>
    </section>
  );
}

function MobileFocus(p: Panels) {
  const pendingOrders = p.orders.filter((order) => ["new", "processing"].includes(order.status));
  const draftProducts = p.products.filter((product) => product.status === "draft");
  const gatedProducts = p.products.filter((product) => !product.availability_confirmed);
  const focus = [
    pendingOrders.length > 0
      ? {
          title: "Process pending orders",
          detail: `${pendingOrders.length} order(s) need fulfilment`,
          to: "/e-commerce/orders",
        }
      : null,
    draftProducts.length > 0
      ? {
          title: "Verify catalogue drafts",
          detail: `${draftProducts.length} draft product(s) need current evidence`,
          to: "/e-commerce/products",
        }
      : null,
    gatedProducts.length > 0
      ? {
          title: "Review availability evidence",
          detail: "Confirm source availability for products and variants",
          to: "/e-commerce/inventory",
        }
      : null,
  ].filter((item): item is { title: string; detail: string; to: string } => item !== null);

  return (
    <section className="rounded-[1.75rem] border border-border/70 bg-card/90 p-4 shadow-[0_16px_42px_-30px_var(--alexos-glow)] sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
            Today&apos;s focus
          </p>
          <h2 className="mt-1 text-xl font-bold tracking-tight">Move the store forward.</h2>
        </div>
        <span className="text-xs text-muted-foreground">{focus.length} open</span>
      </div>
      <div className="mt-4 divide-y divide-border/70">
        {focus.length > 0 ? (
          focus.map((item, index) => (
            <Link
              key={item.title}
              to={item.to}
              className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-primary text-xs font-bold text-primary-foreground">
                {index + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{item.title}</span>
                <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                  {item.detail}
                </span>
              </span>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </Link>
          ))
        ) : (
          <p className="py-3 text-sm text-muted-foreground">
            No open actions are recorded. New orders and catalogue changes will appear here.
          </p>
        )}
      </div>
    </section>
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
    <div className="dashboard-canvas space-y-4 pb-40">
      <Hero kpis={p.kpis} compactMode />
      <FacebookAdsBalanceCard />
      <MobileStoreOverview kpis={p.kpis} trend={p.trend} loading={p.loading} />
      <MobileFocus {...p} />

      <div className="grid gap-4">
        <LiveOrderFeed orders={p.orders} customers={p.customers} loading={p.loading} limit={4} />
        <InventoryMonitor products={p.products} loading={p.loading} limit={4} />
      </div>

      <CatalogueReadinessCard products={p.products} loading={p.loading} />
      <QuickActionsGrid columns={4} />
      <NotificationsPanel products={p.products} orders={p.orders} loading={p.loading} />
      <ProfitCashFlowPanel />
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
    <div className="dashboard-canvas space-y-5">
      <Hero kpis={p.kpis} />
      <FacebookAdsBalanceCard />
      <CatalogueReadinessCard products={p.products} loading={p.loading} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiWall kpis={p.kpis} loading={p.loading} />
      </div>

      <ProfitCashFlowPanel />
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

      <section className="dashboard-surface rounded-[1.75rem] p-5 sm:p-6">
        <h2 className="mb-3 text-lg font-semibold tracking-tight">Operating signals</h2>
        <IntelligencePanel kind="market" ctx={p.ctx} ready={!p.loading} />
      </section>
    </div>
  );
}

/* ── Desktop 1920 & 4K: executive command wall ───────────────── */

function WideDashboard(p: Panels & { dense?: boolean }) {
  return (
    <div className="dashboard-canvas space-y-6">
      <Hero kpis={p.kpis} />
      <FacebookAdsBalanceCard />
      <CatalogueReadinessCard products={p.products} loading={p.loading} />

      <div className={p.dense ? "grid gap-5 grid-cols-8" : "grid gap-5 grid-cols-4"}>
        <KpiWall kpis={p.kpis} loading={p.loading} />
      </div>

      <ProfitCashFlowPanel />
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

      <section className="dashboard-surface rounded-[1.75rem] p-5 sm:p-6">
        <h2 className="mb-3 text-lg font-semibold tracking-tight">Operating signals</h2>
        <IntelligencePanel kind="market" ctx={p.ctx} ready={!p.loading} />
      </section>
    </div>
  );
}
