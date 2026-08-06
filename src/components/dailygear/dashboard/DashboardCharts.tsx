import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3, Facebook, Megaphone, PieChart as PieIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Order, TrendPoint } from "@/lib/dailygear/types";
import { DG_CURRENCY } from "@/lib/dailygear/constants";
import { cn } from "@/lib/utils";

const money = (v: number) =>
  `${DG_CURRENCY} ${Number(v).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

function ChartShell({
  title,
  icon: Icon,
  badge,
  height,
  children,
  className,
}: {
  title: string;
  icon: typeof BarChart3;
  badge?: string;
  height: number;
  children: React.ReactElement;
  className?: string;
}) {
  return (
    <Card className={cn("h-full rounded-3xl border-border/60 soft-shadow", className)}>
      <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
        <CardTitle className="flex min-w-0 items-center gap-2 text-sm font-semibold">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <Icon className="h-3.5 w-3.5" />
          </span>
          <span className="truncate">{title}</span>
        </CardTitle>
        {badge ? (
          <Badge variant="secondary" className="shrink-0 text-[11px]">
            {badge}
          </Badge>
        ) : null}
      </CardHeader>
      <CardContent className="pt-0">
        <div style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            {children}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

const tooltipStyle = {
  borderRadius: 14,
  border: "1px solid var(--color-border)",
  background: "var(--color-card)",
  fontSize: 12,
  color: "var(--color-foreground)",
} as const;

/* ── Revenue analytics ───────────────────────────────────────── */

export function RevenueAnalytics({
  trend,
  loading,
  height = 240,
}: {
  trend: TrendPoint[];
  loading?: boolean;
  height?: number;
}) {
  if (loading) return <Skeleton className="h-full min-h-56 w-full rounded-3xl" />;

  return (
    <ChartShell title="Revenue & profit" icon={BarChart3} badge="Last 6 months" height={height}>
      <AreaChart data={trend} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="dg-rev" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.45} />
            <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="dg-prof" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-chart-2)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--color-chart-2)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
        <YAxis tickLine={false} axisLine={false} fontSize={11} width={54} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => money(v)} />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="var(--color-chart-1)"
          strokeWidth={2}
          fill="url(#dg-rev)"
        />
        <Area
          type="monotone"
          dataKey="profit"
          stroke="var(--color-chart-2)"
          strokeWidth={2}
          fill="url(#dg-prof)"
        />
      </AreaChart>
    </ChartShell>
  );
}

/* ── Channel mix (marketing analytics) ───────────────────────── */

const CHANNEL_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

export function MarketingAnalytics({
  orders,
  loading,
  height = 240,
}: {
  orders: Order[];
  loading?: boolean;
  height?: number;
}) {
  const data = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of orders) {
      const key = o.channel || "direct";
      map.set(key, (map.get(key) ?? 0) + Number(o.total));
    }
    return [...map.entries()].map(([name, value]) => ({ name, value }));
  }, [orders]);

  if (loading) return <Skeleton className="h-full min-h-56 w-full rounded-3xl" />;

  if (!data.length) {
    return (
      <Card className="h-full rounded-3xl border-dashed">
        <CardContent className="grid h-full min-h-56 place-items-center p-6 text-center text-xs text-muted-foreground">
          Channel revenue appears once orders are attributed to a sales channel.
        </CardContent>
      </Card>
    );
  }

  return (
    <ChartShell title="Revenue by channel" icon={PieIcon} height={height}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="82%" paddingAngle={3}>
          {data.map((_, i) => (
            <Cell key={i} fill={CHANNEL_COLORS[i % CHANNEL_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => money(v)} />
      </PieChart>
    </ChartShell>
  );
}

/* ── Orders volume ───────────────────────────────────────────── */

export function OrderVolumeChart({
  trend,
  loading,
  height = 200,
}: {
  trend: TrendPoint[];
  loading?: boolean;
  height?: number;
}) {
  if (loading) return <Skeleton className="h-full min-h-48 w-full rounded-3xl" />;

  return (
    <ChartShell title="Order volume" icon={BarChart3} height={height}>
      <BarChart data={trend} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
        <YAxis tickLine={false} axisLine={false} fontSize={11} width={40} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey="orders" radius={[8, 8, 0, 0]} fill="var(--color-chart-3)" />
      </BarChart>
    </ChartShell>
  );
}

/* ── Facebook / Meta analytics scaffold ──────────────────────── */

export function MetaAnalyticsPanel() {
  const rows = [
    { label: "Reach", value: "—" },
    { label: "CTR", value: "—" },
    { label: "ROAS", value: "—" },
    { label: "Spend", value: "—" },
  ];

  return (
    <Card className="h-full rounded-3xl border-border/60 soft-shadow">
      <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <span className="grid h-7 w-7 place-items-center rounded-xl bg-chart-2/10 text-chart-2">
            <Facebook className="h-3.5 w-3.5" />
          </span>
          Facebook & Meta
        </CardTitle>
        <Badge variant="outline" className="shrink-0 text-[11px]">
          Not connected
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div className="grid grid-cols-2 gap-2">
          {rows.map((r) => (
            <div key={r.label} className="rounded-2xl bg-muted/50 px-3 py-2.5">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{r.label}</p>
              <p className="text-lg font-semibold tabular-nums">{r.value}</p>
            </div>
          ))}
        </div>
        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <Megaphone className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Connect a Meta ad account in Marketing to stream live campaign performance here.
        </p>
      </CardContent>
    </Card>
  );
}
