import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dailygear/PageHeader";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/e-commerce/customers")({
  head: () => ({
    meta: [
      { title: "Customers | DailyGear" },
      { name: "description", content: "Purchase history, lifetime value and segmentation." },
      { property: "og:title", content: "Customers | DailyGear" },
      { property: "og:description", content: "Purchase history, lifetime value and segmentation." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CustomersPage,
});

function CustomersPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Customers" description="Purchase history, lifetime value and segmentation." />
      <Card className="rounded-2xl border-dashed">
        <CardContent className="py-14 text-center text-sm text-muted-foreground">
          This workspace is wired to the commerce data layer and ready for its interface.
        </CardContent>
      </Card>
    </div>
  );
}
