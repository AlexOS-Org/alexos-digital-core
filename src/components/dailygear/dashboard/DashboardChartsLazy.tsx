import { lazy, Suspense, type ReactNode } from "react";

const loadCharts = () => import("./DashboardCharts");

export const MarketingAnalytics = lazy(() =>
  loadCharts().then(({ MarketingAnalytics: Component }) => ({ default: Component })),
);

export const MetaAnalyticsPanel = lazy(() =>
  loadCharts().then(({ MetaAnalyticsPanel: Component }) => ({ default: Component })),
);

export const OrderVolumeChart = lazy(() =>
  loadCharts().then(({ OrderVolumeChart: Component }) => ({ default: Component })),
);

export const RevenueAnalytics = lazy(() =>
  loadCharts().then(({ RevenueAnalytics: Component }) => ({ default: Component })),
);

export function DashboardChartsBoundary({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-24 items-center justify-center rounded-2xl border border-border bg-muted/20 text-sm text-muted-foreground">
          Loading analytics…
        </div>
      }
    >
      {children}
    </Suspense>
  );
}
