import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dailygear/PageHeader";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/e-commerce/orders")({
  head: () => ({
    meta: [
      { title: "Orders | DailyGear" },
      { name: "description", content: "Fulfilment pipeline, payments, shipping and timelines." },
      { property: "og:title", content: "Orders | DailyGear" },
      { property: "og:description", content: "Fulfilment pipeline, payments, shipping and timelines." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OrdersPage,
});

function OrdersPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Orders" description="Fulfilment pipeline, payments, shipping and timelines." />
      <Card className="rounded-2xl border-dashed">
        <CardContent className="py-14 text-center text-sm text-muted-foreground">
          This workspace is wired to the commerce data layer and ready for its interface.
        </CardContent>
      </Card>
    </div>
  );
}
