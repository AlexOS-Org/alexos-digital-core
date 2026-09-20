import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AurenDataFeed } from "@/lib/auren/data-readiness";

type Summary = {
  waiting: number;
  partial: number;
  ready: number;
  headline: string;
};

export function AurenReadinessPanel({
  feeds,
  summary,
  responseStatus,
}: {
  feeds: AurenDataFeed[];
  summary: Summary;
  responseStatus: "ready" | "no_data" | "ai_unavailable" | null | undefined;
}) {
  return (
    <Card className="rounded-3xl border-violet-500/25 bg-violet-500/[0.04] soft-shadow">
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2 text-base">
          What Auren is receiving — and what it still needs
          <Badge variant="outline" className="ml-auto text-xs">
            {responseStatus === "no_data" ? "No live data yet" : "Decision inputs"}
          </Badge>
        </CardTitle>
        <p className="text-sm leading-6 text-muted-foreground">{summary.headline}</p>
        <p className="text-xs text-muted-foreground">
          Ready {summary.ready} · Partial {summary.partial} · Needs data {summary.waiting}
        </p>
        {summary.waiting > 0 ? (
          <p className="text-xs leading-5 text-muted-foreground">
            Each card below explains the gap and links to the page where you can fill it. Auren
            never invents missing figures.
          </p>
        ) : null}
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        {feeds.map((feed) => {
          const needsAction = feed.status !== "ready" && Boolean(feed.actionTo && feed.actionLabel);
          return (
            <div
              key={feed.id}
              className={
                feed.status === "waiting"
                  ? "min-w-0 rounded-2xl border border-amber-500/30 bg-amber-500/[0.04] p-4"
                  : feed.status === "partial"
                    ? "min-w-0 rounded-2xl border border-sky-500/25 bg-sky-500/[0.04] p-4"
                    : "min-w-0 rounded-2xl border border-border/60 bg-card/80 p-4"
              }
            >
              <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
                <p className="text-sm font-semibold">{feed.source}</p>
                <Badge
                  variant={feed.status === "ready" ? "secondary" : "outline"}
                  className={
                    feed.status === "waiting"
                      ? "border-amber-500/40 text-amber-800 dark:text-amber-200"
                      : feed.status === "partial"
                        ? "border-sky-500/40 text-sky-800 dark:text-sky-200"
                        : undefined
                  }
                >
                  {feed.status === "ready"
                    ? "Receiving data"
                    : feed.status === "partial"
                      ? "Partial — keep going"
                      : "Needs data"}
                </Badge>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{feed.waitingFor}</p>
              <p className="mt-2 text-sm leading-6">
                <span className="font-semibold">Why it matters:</span> {feed.benefit}
              </p>
              {feed.detail ? (
                <p className="mt-2 text-xs text-muted-foreground">{feed.detail}</p>
              ) : null}
              {needsAction ? (
                <Button asChild size="sm" className="mt-3 h-8 text-xs">
                  <a href={feed.actionTo}>
                    {feed.actionLabel} <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </a>
                </Button>
              ) : feed.actionTo && feed.actionLabel ? (
                <Button asChild variant="link" className="mt-2 h-auto px-0 text-xs">
                  <a href={feed.actionTo}>
                    {feed.actionLabel} <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </a>
                </Button>
              ) : null}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
