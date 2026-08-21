import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink, Filter, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/dailygear/PageHeader";
import { IntelligencePanel } from "@/components/dailygear/IntelligencePanel";
import { useCommerceData } from "@/lib/dailygear/useCommerceData";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/e-commerce/competitors")({
  head: () => ({
    meta: [
      { title: "Competitor Intelligence | DailyGear" },
      {
        name: "description",
        content: "Evidence-first pricing, assortment and promotion research.",
      },
      { property: "og:title", content: "Competitor Intelligence | DailyGear" },
      {
        property: "og:description",
        content: "Evidence-first pricing, assortment and promotion research.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CompetitorsPage,
});

type ResearchSource = {
  name: string;
  pageUrl: string;
  adsUrl: string;
  note: string;
};

const RESEARCH_SOURCES: ResearchSource[] = [
  {
    name: "Jumia Kenya",
    pageUrl: "https://www.facebook.com/JumiaKenya",
    adsUrl:
      "https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=KE&is_targeted_country=false&media_type=all&q=Jumia%20Kenya",
    note: "Public retailer reference requested by the owner.",
  },
  {
    name: "Kilimall Kenya",
    pageUrl: "https://www.facebook.com/kilimall.ke",
    adsUrl:
      "https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=KE&is_targeted_country=false&media_type=all&q=Kilimall%20Kenya",
    note: "Public retailer reference requested by the owner.",
  },
];

function CompetitorsPage() {
  const { context, isLoading } = useCommerceData();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Competitor Intelligence"
        description="Use verified internal sales signals and public research links without fabricating audience or ad-duration data."
      />
      <CompetitorResearchPanel />
      <IntelligencePanel kind="competitor" ctx={context} ready={!isLoading} />
    </div>
  );
}

function CompetitorResearchPanel() {
  const [query, setQuery] = useState("");
  const [minimumAudience, setMinimumAudience] = useState("2500");
  const [minimumAdAge, setMinimumAdAge] = useState("30");
  const sources = useMemo(
    () =>
      RESEARCH_SOURCES.filter((source) =>
        source.name.toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [query],
  );

  return (
    <Card className="rounded-3xl border-primary/20 bg-card/80">
      <CardHeader className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Filter className="h-4 w-4 text-primary" /> Public ad and retailer research
            </CardTitle>
            <p className="mt-1 max-w-3xl text-xs leading-5 text-muted-foreground">
              Long-running means an ad has an evidence-backed start date at least 30 days ago. The
              connected Ads Manager provides DailyGear account data; Facebook page audience counts
              and competitor Ads Library records still require public-source verification.
            </p>
          </div>
          <Badge variant="outline">No invented metrics</Badge>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="space-y-1.5 text-xs font-semibold">
            Search source
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Jumia, Kilimall"
              className="h-10 w-full rounded-xl border bg-background px-3 text-sm font-normal outline-none focus:ring-2 focus:ring-primary/30"
            />
          </label>
          <label className="space-y-1.5 text-xs font-semibold">
            Minimum page audience
            <select
              value={minimumAudience}
              onChange={(event) => setMinimumAudience(event.target.value)}
              className="h-10 w-full rounded-xl border bg-background px-3 text-sm font-normal outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="2500">2,500+</option>
              <option value="10000">10,000+</option>
              <option value="50000">50,000+</option>
            </select>
          </label>
          <label className="space-y-1.5 text-xs font-semibold">
            Minimum ad age
            <select
              value={minimumAdAge}
              onChange={(event) => setMinimumAdAge(event.target.value)}
              className="h-10 w-full rounded-xl border bg-background px-3 text-sm font-normal outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="30">30+ days</option>
              <option value="60">60+ days</option>
              <option value="90">90+ days</option>
            </select>
          </label>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {sources.map((source) => (
          <div key={source.name} className="rounded-2xl border bg-muted/20 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{source.name}</p>
                  <Badge variant="secondary">Research candidate</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{source.note}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full border px-2.5 py-1 text-muted-foreground">
                    Audience ≥ {Number(minimumAudience).toLocaleString()}: Not verified
                  </span>
                  <span className="rounded-full border px-2.5 py-1 text-muted-foreground">
                    Active ad ≥ {minimumAdAge} days: Not verified
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <a
                  href={source.adsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold hover:bg-muted"
                >
                  Ads Library <ExternalLink className="h-3.5 w-3.5" />
                </a>
                <a
                  href={source.pageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90"
                >
                  Public page <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>
        ))}
        {!sources.length ? (
          <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            No requested research source matches this search.
          </p>
        ) : null}
        <div className="flex items-start gap-2 rounded-2xl border border-primary/15 bg-primary/[0.04] p-3 text-xs text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p>
            The current browser session cannot verify follower counts when a public Facebook page
            redirects to login. Open the source links while signed in and record the visible count
            and ad start date before using a competitor as a benchmark.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
