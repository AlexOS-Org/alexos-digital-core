import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dailygear/PageHeader";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/e-commerce/reports")({
  head: () => ({
    meta: [
      { title: "Reports | DailyGear" },
      { name: "description", content: "Sales, profit, product and customer reporting." },
      { property: "og:title", content: "Reports | DailyGear" },
      { property: "og:description", content: "Sales, profit, product and customer reporting." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Reports" description="Sales, profit, product and customer reporting." />
      <Card className="rounded-2xl border-dashed">
        <CardContent className="py-14 text-center text-sm text-muted-foreground">
          This workspace is wired to the commerce data layer and ready for its interface.
        </CardContent>
      </Card>
    </div>
  );
}
