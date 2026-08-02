import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dailygear/PageHeader";
import { IntelligencePanel } from "@/components/dailygear/IntelligencePanel";
import { useCommerceData } from "@/lib/dailygear/useCommerceData";

export const Route = createFileRoute("/_authenticated/e-commerce/landing-pages")({
  head: () => ({
    meta: [
      { title: "Landing Pages | DailyGear" },
      { name: "description", content: "Generated product pages, copy blocks and SEO metadata." },
      { property: "og:title", content: "Landing Pages | DailyGear" },
      { property: "og:description", content: "Generated product pages, copy blocks and SEO metadata." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LandingPagesPage,
});

function LandingPagesPage() {
  const { context, isLoading } = useCommerceData();
  return (
    <div className="space-y-6">
      <PageHeader title="Landing Pages" description="Generated product pages, copy blocks and SEO metadata." />
      <IntelligencePanel kind="landing" ctx={context} ready={!isLoading} />
    </div>
  );
}
