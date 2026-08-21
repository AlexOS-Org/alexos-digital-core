import { Link, useRouterState } from "@tanstack/react-router";
import { DAILYGEAR_SECTIONS } from "@/lib/dailygear/registry";
import { cn } from "@/lib/utils";

/** Renders itself from the section registry — never edit this to add a page. */
export function DailyGearNav() {
  const path = useRouterState({ select: (r) => r.location.pathname });

  return (
    <div className="relative -mx-4 border-b border-border/70 bg-background/85 px-4 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 sticky top-14 z-[5]">
      <div className="alexos-visual-strip absolute inset-x-0 top-0 h-0.5 opacity-80" />
      <nav
        className="no-scrollbar flex gap-1 overflow-x-auto py-2 pt-2.5 scrollbar-thin"
        aria-label="DailyGear sections"
      >
        {DAILYGEAR_SECTIONS.map((section) => {
          const active = section.exact ? path === section.to : path.startsWith(section.to);
          return (
            <Link
              key={section.to}
              to={section.to}
              className={cn(
                "inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <section.icon className="h-4 w-4" />
              {section.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
