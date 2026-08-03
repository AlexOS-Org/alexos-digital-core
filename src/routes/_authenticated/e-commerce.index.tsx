import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { Boxes, DollarSign, ShoppingCart, TrendingUp, Users } from "lucide-react";
import { PageHeader } from "@/components/dailygear/PageHeader";
import { KpiCard } from "@/components/dailygear/KpiCard";
import { IntelligencePanel } from "@/components/dailygear/IntelligencePanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCommerceData } from "@/lib/dailygear/useCommerceData";
import { computeKpis, computeTrend } from "@/lib/dailygear/calculations";
import { DG_CURRENCY } from "@/lib/dailygear/constants";

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

function CommerceOverview() {
  const navigate = useNavigate();
  const { products, orders, orderItems, customers, context, isLoading } = useCommerceData();

  const kpis = useMemo(
    () => computeKpis(orders, orderItems, products, customers),
    [orders, orderItems, products, customers],
  );
  const trend = useMemo(() => computeTrend(orders, orderItems), [orders, orderItems]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="DailyGear Commerce"
        description="Executive view of revenue, profitability, fulfilment and inventory health."
        actions={
          <Button onClick={() => navigate({ to: "/_authenticated/e-commerce/store" })}>
            Store preview
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Revenue (30d)"
          value={money(kpis.revenue)}
          icon={DollarSign}
          changePct={kpis.revenueChangePct}
          loading={isLoading}
        />
        <KpiCard
          label="Gross profit"
          value={money(kpis.profit)}
          icon={TrendingUp}
          tone="positive"
          loading={isLoading}
        />
        <KpiCard
          label="Orders (30d)"
          value={kpis.orders}
          icon={ShoppingCart}
          changePct={kpis.ordersChangePct}
          hint={`${kpis.pendingOrders} awaiting fulfilment`}
          loading={isLoading}
        />
        <KpiCard
          label="Inventory value"
          value={money(kpis.inventoryValue)}
          icon={Boxes}
          tone={kpis.lowStockCount ? "warning" : "default"}
          hint={`${kpis.lowStockCount} low-stock items`}
          loading={isLoading}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Average order value"
          value={money(kpis.averageOrderValue)}
          icon={DollarSign}
          loading={isLoading}
        />
        <KpiCard
          label="Customers"
          value={kpis.customers}
          icon={Users}
          hint={`${kpis.returningCustomers} returning`}
          loading={isLoading}
        />
        <KpiCard
          label="Delivered orders"
          value={kpis.deliveredOrders}
          icon={ShoppingCart}
          tone="positive"
          loading={isLoading}
        />
        <KpiCard
          label="Purchase rate"
          value={`${kpis.conversionRate.toFixed(0)}%`}
          icon={TrendingUp}
          hint="Customers who have ordered"
          loading={isLoading}
        />
      </div>

      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Revenue &amp; profit trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {trend.map((point) => (
              <div key={point.label} className="rounded-xl border border-border/70 p-3">
                <p className="text-xs font-medium uppercase text-muted-foreground">{point.label}</p>
                <p className="mt-1 text-sm font-semibold">{money(point.revenue)}</p>
                <p className="text-xs text-muted-foreground">
                  {point.orders} orders · {money(point.profit)} profit
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-lg font-semibold tracking-tight">Operating signals</h2>
        <IntelligencePanel kind="market" ctx={context} ready={!isLoading} />
      </div>
    </div>
  );
}
