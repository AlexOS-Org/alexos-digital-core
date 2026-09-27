import { ArrowUpRight, Settings2, Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";

const LINKS = [
  { to: "/dashboard", label: "Home" },
  { to: "/auren", label: "Auren" },
  { to: "/settings", label: "Settings" },
  { to: "/e-commerce", label: "DailyGear" },
] as const;

export function AlexosDashboardFooter() {
  return (
    <footer className="alexos-dashboard-footer mt-12">
      <div className="mx-auto flex max-w-[1800px] flex-col gap-5 px-4 py-7 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg dashboard-tone-blue dashboard-tone-icon">
            <Sparkles className="size-4" aria-hidden="true" />
          </span>
          <div>
            <p className="alexos-footer-brand text-sm">AlexOS</p>
            <p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
              One operating system for your life, work and businesses.
            </p>
          </div>
        </div>

        <nav
          className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs"
          aria-label="AlexOS footer"
        >
          {LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="alexos-focusable inline-flex items-center gap-1 rounded-lg px-1 py-1 font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
              <ArrowUpRight className="size-3 opacity-50" aria-hidden="true" />
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <Settings2 className="size-3.5" aria-hidden="true" />
          <span>Appearance is controlled in Settings</span>
        </div>
      </div>
    </footer>
  );
}
