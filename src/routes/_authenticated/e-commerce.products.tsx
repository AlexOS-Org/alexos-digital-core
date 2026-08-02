import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dailygear/PageHeader";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/e-commerce/products")({
  head: () => ({
    meta: [
      { title: "Products | DailyGear" },
      { name: "description", content: "Catalogue, pricing, cost, stock and supplier data." },
      { property: "og:title", content: "Products | DailyGear" },
      { property: "og:description", content: "Catalogue, pricing, cost, stock and supplier data." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProductsPage,
});

function ProductsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Products" description="Catalogue, pricing, cost, stock and supplier data." />
      <Card className="rounded-2xl border-dashed">
        <CardContent className="py-14 text-center text-sm text-muted-foreground">
          This workspace is wired to the commerce data layer and ready for its interface.
        </CardContent>
      </Card>
    </div>
  );
}
