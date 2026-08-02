import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dailygear/PageHeader";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/e-commerce/settings")({
  head: () => ({
    meta: [
      { title: "Commerce Settings | DailyGear" },
      { name: "description", content: "Business, tax, shipping, currency and integrations." },
      { property: "og:title", content: "Commerce Settings | DailyGear" },
      { property: "og:description", content: "Business, tax, shipping, currency and integrations." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Commerce Settings" description="Business, tax, shipping, currency and integrations." />
      <Card className="rounded-2xl border-dashed">
        <CardContent className="py-14 text-center text-sm text-muted-foreground">
          This workspace is wired to the commerce data layer and ready for its interface.
        </CardContent>
      </Card>
    </div>
  );
}
