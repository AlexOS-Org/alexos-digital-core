import { BookOpen, Quote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getDailyInspiration } from "@/lib/dashboard/inspiration";

export function DailyInspirationCards() {
  const inspiration = getDailyInspiration();

  return (
    <section className="grid gap-4 lg:grid-cols-2" aria-label="Daily inspiration">
      <Card className="alexos-inspiration-card h-full rounded-3xl border-border/60 bg-gradient-to-br from-emerald-50/90 to-background shadow-sm dark:from-emerald-950/45">
        <CardContent className="p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
            <BookOpen className="h-4 w-4" aria-hidden="true" />
            <span>Today’s anchor</span>
          </div>
          <p className="text-[15px] leading-7 text-foreground/80">{inspiration.verse.text}</p>
          <p className="mt-4 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
            {inspiration.verse.reference}
          </p>
        </CardContent>
      </Card>

      <Card className="alexos-inspiration-card h-full rounded-3xl border-border/60 bg-gradient-to-br from-violet-50/80 to-background shadow-sm dark:from-violet-950/45">
        <CardContent className="p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-violet-700 dark:text-violet-300">
            <Quote className="h-4 w-4" aria-hidden="true" />
            <span>One thought worth carrying</span>
          </div>
          <p className="text-[15px] italic leading-7 text-foreground/80">
            “{inspiration.quote.text}”
          </p>
          <p className="mt-4 text-sm font-semibold text-violet-700 dark:text-violet-300">
            — {inspiration.quote.author}
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
