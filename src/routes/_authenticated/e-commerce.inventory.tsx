import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dailygear/PageHeader";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/e-commerce/inventory")({
  head: () => ({
    meta: [
      { title: "Inventory | DailyGear" },
      { name: "description", content: "Stock levels, movements, reorder and dead-stock signals." },
      { property: "og:title", content: "Inventory | DailyGear" },
      { property: "og:description", content: "Stock levels, movements, reorder and dead-stock signals." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: InventoryPage,
});

function InventoryPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Inventory" description="Stock levels, movements, reorder and dead-stock signals." />
      <Card className="rounded-2xl border-dashed">
        <CardContent className="py-14 text-center text-sm text-muted-foreground">
          This workspace is wired to the commerce data layer and ready for its interface.
        </CardContent>
      </Card>
    </div>
  );
}
