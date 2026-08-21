import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Database, Instagram, Megaphone, ShieldCheck } from "lucide-react";
import { ProductEvidencePanel } from "@/components/dailygear/ProductEvidencePanel";
import { PageHeader } from "@/components/dailygear/PageHeader";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/e-commerce/evidence")({
  head: () => ({
    meta: [
      { title: "Source reconciliation | DailyGear" },
      {
        name: "description",
        content: "Verify product, marketing and availability evidence before publication.",
      },
      { property: "og:title", content: "Source reconciliation | DailyGear" },
      {
        property: "og:description",
        content: "Verify product, marketing and availability evidence before publication.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EvidencePage,
});

function EvidencePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Source reconciliation"
        description="Preserve verified product evidence before catalogue import or publication."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            icon: Database,
            label: "Commerce Manager",
            value: "Not connected",
            detail: "No catalogue feed is available to AlexOS yet.",
            tone: "text-violet-500",
          },
          {
            icon: Megaphone,
            label: "Meta Ads",
            value: "Historical evidence",
            detail: "Use campaign and ad IDs as traceable references.",
            tone: "text-blue-500",
          },
          {
            icon: Instagram,
            label: "Instagram",
            value: "Historical evidence",
            detail: "Captions and post URLs remain source material only.",
            tone: "text-pink-500",
          },
          {
            icon: ShieldCheck,
            label: "Publication gate",
            value: "15 units + confirmed",
            detail: "Active products must pass the database rule first.",
            tone: "text-emerald-500",
          },
        ].map((source) => (
          <Card key={source.label} className="rounded-2xl border-border/70 bg-card/75">
            <CardContent className="flex gap-3 p-4">
              <source.icon className={`mt-0.5 h-5 w-5 shrink-0 ${source.tone}`} />
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {source.label}
                </p>
                <p className="mt-1 font-semibold">{source.value}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {source.detail}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-3xl border-emerald-500/20 bg-emerald-500/[0.06]">
        <CardContent className="flex gap-3 p-5 text-sm">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          <p className="leading-relaxed text-muted-foreground">
            Historical ads and social posts can support copy and product identity, but they do not
            prove current stock, current pricing or current delivery availability. Keep candidates
            unmatched until those facts are confirmed in the current catalogue.
          </p>
        </CardContent>
      </Card>

      <ProductEvidencePanel />
    </div>
  );
}
