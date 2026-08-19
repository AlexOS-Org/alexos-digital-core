import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dailygear/PageHeader";
import { ProfitCashFlowPanel } from "@/components/dailygear/ProfitCashFlowPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/e-commerce/reports")({
  head: () => ({
    meta: [
      { title: "Reports | DailyGear" },
      { name: "description", content: "Sales, profit, cash flow and operating reporting." },
      { property: "og:title", content: "Reports | DailyGear" },
      { property: "og:description", content: "Sales, profit, cash flow and operating reporting." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Revenue, COGS, Meta Spend, operating profit and cash flow."
      />
      <ProfitCashFlowPanel />
      <Card className="rounded-2xl border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">How to read this report</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm text-muted-foreground md:grid-cols-3">
          <p>
            <strong className="text-foreground">Operating profit</strong> subtracts COGS, Spend,
            payment fees, delivery costs and other operating outflows from recognized revenue.
          </p>
          <p>
            <strong className="text-foreground">Net cash flow</strong> uses receipts and explicit
            cash movements. Supplier payments affect cash separately from accounting COGS.
          </p>
          <p>
            <strong className="text-foreground">Data quality</strong> warnings identify missing
            costs, multiple currencies or unavailable Meta values. Nothing is estimated.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
