import { useState } from "react";
import { Search, Sparkles } from "lucide-react";

/**
 * Intelligence Search — UI foundation for a future natural-language query
 * interface over AlexOS data. No model integration yet.
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
          placeholder="Ask Auren about cash position, overdue bills, pipeline value…"
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          aria-label="Ask Auren"
        />
      </div>
      <p className="mt-2 flex items-center gap-1.5 pl-8 text-[11px] text-muted-foreground">
        <Sparkles className="h-3 w-3 text-[var(--alexos-purple)]" />
        Natural-language querying arrives in a later release.
      </p>
    </div>
  );
}
