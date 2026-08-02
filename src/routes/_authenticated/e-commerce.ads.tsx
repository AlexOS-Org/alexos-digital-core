import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dailygear/PageHeader";
import { IntelligencePanel } from "@/components/dailygear/IntelligencePanel";
import { useCommerceData } from "@/lib/dailygear/useCommerceData";

export const Route = createFileRoute("/_authenticated/e-commerce/ads")({
  head: () => ({
    meta: [
      { title: "Ad Studio | DailyGear" },
      { name: "description", content: "Ad variants, creatives, audiences and budget guidance." },
      { property: "og:title", content: "Ad Studio | DailyGear" },
      { property: "og:description", content: "Ad variants, creatives, audiences and budget guidance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdsPage,
});

function AdsPage() {
  const { context, isLoading } = useCommerceData();
  return (
    <div className="space-y-6">
      <PageHeader title="Ad Studio" description="Ad variants, creatives, audiences and budget guidance." />
      <IntelligencePanel kind="advertising" ctx={context} ready={!isLoading} />
    </div>
  );
}
