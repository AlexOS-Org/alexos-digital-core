import { BookOpen, Quote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getDailyInspiration } from "@/lib/dashboard/inspiration";

export function DailyInspirationCards() {
  const inspiration = getDailyInspiration();

  return (
    <section className="grid gap-4 lg:grid-cols-2" aria-label="Daily inspiration">
      <Card className="alexos-inspiration-card h-full rounded-3xl border-border/60 dashboard-tone-green dashboard-tone-panel shadow-sm">
        <CardContent className="p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold dashboard-tone-green dashboard-tone-text">
            <BookOpen className="h-4 w-4" aria-hidden="true" />
            <span>Today’s anchor</span>
          </div>
          <p className="text-[15px] leading-7 text-foreground/80">{inspiration.verse.text}</p>
          <p className="mt-4 text-sm font-semibold dashboard-tone-green dashboard-tone-text">
            {inspiration.verse.reference}
          </p>
        </CardContent>
      </Card>

      <Card className="alexos-inspiration-card h-full rounded-3xl border-border/60 dashboard-tone-purple dashboard-tone-panel shadow-sm">
        <CardContent className="p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold dashboard-tone-purple dashboard-tone-text">
            <Quote className="h-4 w-4" aria-hidden="true" />
            <span>One thought worth carrying</span>
          </div>
          <p className="text-[15px] italic leading-7 text-foreground/80">
            “{inspiration.quote.text}”
          </p>
          <p className="mt-4 text-sm font-semibold dashboard-tone-purple dashboard-tone-text">
            — {inspiration.quote.author}
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
