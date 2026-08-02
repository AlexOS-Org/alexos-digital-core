import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dailygear/PageHeader";
import { IntelligencePanel } from "@/components/dailygear/IntelligencePanel";
import { useCommerceData } from "@/lib/dailygear/useCommerceData";

export const Route = createFileRoute("/_authenticated/e-commerce/competitors")({
  head: () => ({
    meta: [
      { title: "Competitor Intelligence | DailyGear" },
      { name: "description", content: "Pricing, assortment and promotion monitoring." },
      { property: "og:title", content: "Competitor Intelligence | DailyGear" },
      { property: "og:description", content: "Pricing, assortment and promotion monitoring." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CompetitorsPage,
});

function CompetitorsPage() {
  const { context, isLoading } = useCommerceData();
  return (
    <div className="space-y-6">
      <PageHeader title="Competitor Intelligence" description="Pricing, assortment and promotion monitoring." />
      <IntelligencePanel kind="competitor" ctx={context} ready={!isLoading} />
    </div>
  );
}
