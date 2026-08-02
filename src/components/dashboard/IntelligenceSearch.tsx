import { useState } from "react";
import { Search, Sparkles } from "lucide-react";

/**
 * Auren Search
 * Natural-language search across AlexOS business data.
 * AI integration comes in a later release.
 */
export default function IntelligenceSearch() {
  const [query, setQuery] = useState("");

  return (
    <div className="rounded-2xl border border-border/60 bg-card/80 p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <Search className="h-5 w-5 shrink-0 text-muted-foreground" />

        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Ask Auren about cash flow, DailyGear, CarBar Motion, Nuvora, customers, sales or opportunities..."
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          aria-label="Auren Search"
        />
      </div>

      <p className="mt-2 flex items-center gap-1.5 pl-8 text-[11px] text-muted-foreground">
        <Sparkles className="h-3 w-3 text-[var(--alexos-purple)]" />
        Auren will become your natural-language business intelligence workspace in a future release.
      </p>
    </div>
  );
}
