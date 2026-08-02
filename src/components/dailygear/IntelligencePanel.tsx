import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { providersFor, useIntelligence } from "@/lib/dailygear/intelligence";
import type { IntelligenceContext, IntelligenceKind } from "@/lib/dailygear/types";
import { Lightbulb, PlugZap } from "lucide-react";

const toneClass = {
  positive: "border-l-success",
  neutral: "border-l-primary",
  warning: "border-l-chart-4",
  critical: "border-l-destructive",
} as const;

/**
 * Renders whatever the registered providers return for a given kind.
 * Adding an AI or third-party source later requires no change here.
 */
export function IntelligencePanel({
  kind,
  ctx,
  ready = true,
  emptyLabel = "No signals yet — add products, orders and customers to generate intelligence.",
}: {
  kind: IntelligenceKind;
  ctx: IntelligenceContext;
  ready?: boolean;
  emptyLabel?: string;
}) {
  const { data: insights = [], isLoading } = useIntelligence(kind, ctx, ready);
  const providers = providersFor(kind);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-3 lg:col-span-2">
        {isLoading &&
          [0, 1, 2].map((i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}

        {!isLoading && insights.length === 0 && (
          <Card className="rounded-2xl border-dashed">
            <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
              <Lightbulb className="h-6 w-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground max-w-md">{emptyLabel}</p>
            </CardContent>
          </Card>
        )}

        {insights.map((insight) => (
          <Card
            key={insight.id}
            className={cn("rounded-2xl border-l-4 shadow-sm", toneClass[insight.tone])}
          >
            <CardContent className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className="font-medium">{insight.title}</h3>
                {insight.metric && (
                  <Badge variant="secondary" className="font-medium">
                    {insight.metric}
                  </Badge>
                )}
              </div>
              <p className="mt-1.5 text-sm text-muted-foreground">{insight.summary}</p>
              {insight.recommendation && (
                <p className="mt-3 rounded-xl bg-muted/60 p-3 text-sm">
                  <span className="font-medium">Recommended: </span>
                  {insight.recommendation}
                </p>
              )}
              <p className="mt-3 text-xs text-muted-foreground">Source: {insight.source}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-2xl h-fit">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <PlugZap className="h-4 w-4 text-primary" />
            Data sources
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {providers.map((p) => (
            <div key={p.id} className="rounded-xl border border-border/70 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">{p.label}</p>
                <Badge
                  variant="outline"
                  className={
                    p.enabled
                      ? "bg-success/10 text-success border-success/20"
                      : "bg-muted text-muted-foreground"
                  }
                >
                  {p.enabled ? "Live" : "Available"}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{p.description}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
