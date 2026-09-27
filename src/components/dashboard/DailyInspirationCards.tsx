import { BookOpen, Quote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getDailyInspiration } from "@/lib/dashboard/inspiration";

export function DailyInspirationCards() {
  const inspiration = getDailyInspiration();

  return (
    <section className="grid gap-4 lg:grid-cols-2" aria-label="Daily inspiration">
      <Card data-tone="income" className="alexos-inspiration-card h-full">
        <CardContent className="p-5 sm:p-6">
          <div className="alexos-eyebrow mb-4 flex items-center gap-2">
            <BookOpen className="size-4" aria-hidden="true" />
            <span>Today’s anchor</span>
          </div>
          <p className="text-[15px] leading-7 text-foreground">{inspiration.verse.text}</p>
          <p className="alexos-tone-text mt-4 text-sm font-semibold">
            {inspiration.verse.reference}
          </p>
        </CardContent>
      </Card>

      <Card data-tone="info" className="alexos-inspiration-card h-full">
        <CardContent className="p-5 sm:p-6">
          <div className="alexos-eyebrow mb-4 flex items-center gap-2">
            <Quote className="size-4" aria-hidden="true" />
            <span>One thought worth carrying</span>
          </div>
          <p className="text-[15px] italic leading-7 text-foreground/80">
            “{inspiration.quote.text}”
          </p>
          <p className="alexos-tone-text mt-4 text-sm font-semibold">
            — {inspiration.quote.author}
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
