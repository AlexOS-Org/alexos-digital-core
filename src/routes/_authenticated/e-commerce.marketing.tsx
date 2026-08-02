import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dailygear/PageHeader";
import { IntelligencePanel } from "@/components/dailygear/IntelligencePanel";
import { useCommerceData } from "@/lib/dailygear/useCommerceData";

export const Route = createFileRoute("/_authenticated/e-commerce/marketing")({
  head: () => ({
    meta: [
      { title: "Marketing Intelligence | DailyGear" },
      { name: "description", content: "Channel performance, ROAS, CTR, CPC and CPA." },
      { property: "og:title", content: "Marketing Intelligence | DailyGear" },
      { property: "og:description", content: "Channel performance, ROAS, CTR, CPC and CPA." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MarketingPage,
});

function MarketingPage() {
  const { context, isLoading } = useCommerceData();
  return (
    <div className="space-y-6">
      <PageHeader title="Marketing Intelligence" description="Channel performance, ROAS, CTR, CPC and CPA." />
      <IntelligencePanel kind="marketing" ctx={context} ready={!isLoading} />
    </div>
  );
}
