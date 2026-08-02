import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dailygear/PageHeader";
import { IntelligencePanel } from "@/components/dailygear/IntelligencePanel";
import { useCommerceData } from "@/lib/dailygear/useCommerceData";

export const Route = createFileRoute("/_authenticated/e-commerce/market")({
  head: () => ({
    meta: [
      { title: "Market Intelligence | DailyGear" },
      { name: "description", content: "Demand, category trends and seasonal opportunity." },
      { property: "og:title", content: "Market Intelligence | DailyGear" },
      { property: "og:description", content: "Demand, category trends and seasonal opportunity." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MarketPage,
});

function MarketPage() {
  const { context, isLoading } = useCommerceData();
  return (
    <div className="space-y-6">
      <PageHeader title="Market Intelligence" description="Demand, category trends and seasonal opportunity." />
      <IntelligencePanel kind="market" ctx={context} ready={!isLoading} />
    </div>
  );
}
