import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AurenAdvisoryResponse, AurenAdvisorySnapshot } from "@/lib/auren/advisor.server";
import {
  buildAurenDataReadiness,
  summarizeReadiness,
  type AurenDataFeed,
} from "@/lib/auren/data-readiness";

function feedStatusBadge(status: AurenDataFeed["status"]) {
  if (status === "ready") {
    return <Badge variant="secondary">Receiving data</Badge>;
  }
  if (status === "partial") {
    return <Badge variant="outline">Partial</Badge>;
  }
  return <Badge variant="outline">Waiting</Badge>;
}

export function AurenDataReadinessPanel({
  advisory,
  responseStatus,
}: {
  advisory: AurenAdvisorySnapshot;
  responseStatus: AurenAdvisoryResponse["status"] | null;
}) {
  const feeds = buildAurenDataReadiness(advisory, responseStatus);
  const summary = summarizeReadiness(feeds);

  if (feeds.length === 0) return null;

  return (
    <Card className="rounded-3xl border-violet-500/25 bg-violet-500/[0.04] soft-shadow">
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2 text-base">
          What Auren is receiving — and what it is still waiting for
          <Badge variant="outline" className="ml-auto text-xs">
            {responseStatus === "no_data" ? "No live data yet" : "Decision inputs"}
          </Badge>
        </CardTitle>
        <p className="text-sm leading-6 text-muted-foreground">{summary.headline}</p>
        <p className="text-xs text-muted-foreground">
          Ready {summary.ready} · Partial {summary.partial} · Waiting {summary.waiting}
        </p>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        {feeds.map((feed) => (
          <div key={feed.id} className="min-w-0 rounded-2xl border border-border/60 bg-card/80 p-4">
            <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
              <p className="text-sm font-semibold">{feed.source}</p>
              {feedStatusBadge(feed.status)}
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{feed.waitingFor}</p>
            <p className="mt-2 text-sm leading-6">
              <span className="font-semibold">Decision benefit:</span> {feed.benefit}
            </p>
            {feed.detail ? (
              <p className="mt-2 text-xs text-muted-foreground">{feed.detail}</p>
            ) : null}
            {feed.actionTo && feed.actionLabel ? (
              <Button asChild variant="link" className="mt-2 h-auto px-0 text-xs">
                <a href={feed.actionTo}>
                  {feed.actionLabel} <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </a>
              </Button>
            ) : null}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
