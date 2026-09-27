import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

export interface AlexOSBreadcrumb {
  label: string;
  to?: string;
}

/**
 * The one page header for the authenticated AlexOS admin.
 *
 * Replaces five separate heading patterns found during the audit (Money Center's
 * `text-2xl font-semibold`, Bills' `text-3xl font-bold`, Analytics' unstyled
 * `<header>`, People/Crm's inline block, and DailyGear's PageHeader) with a
 * single responsive layout so every screen answers the same three questions:
 * where am I, what is this, and what is the primary action.
 */
export function AlexOSPageHeader({
  title,
  description,
  actions,
  breadcrumbs,
  eyebrow,
  meta,
  className,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  breadcrumbs?: AlexOSBreadcrumb[];
  eyebrow?: string;
  meta?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("alexos-page-header", className)}>
      <div className="min-w-0">
        {breadcrumbs && breadcrumbs.length > 0 ? (
          <nav aria-label="Breadcrumb" className="alexos-breadcrumb">
            {breadcrumbs.map((crumb, index) => (
              <span key={`${crumb.label}-${index}`} className="inline-flex items-center gap-1.5">
                {index > 0 ? (
                  <ChevronRight
                    aria-hidden="true"
                    className="alexos-breadcrumb-separator size-3.5"
                  />
                ) : null}
                {crumb.to ? (
                  <Link to={crumb.to}>{crumb.label}</Link>
                ) : (
                  <span aria-current="page" className="font-semibold text-foreground">
                    {crumb.label}
                  </span>
                )}
              </span>
            ))}
          </nav>
        ) : null}
        {eyebrow ? <p className="alexos-eyebrow mb-1.5">{eyebrow}</p> : null}
        <h1 className="alexos-page-title">{title}</h1>
        {description ? <p className="alexos-page-description">{description}</p> : null}
        {meta ? <div className="mt-3 flex flex-wrap items-center gap-2">{meta}</div> : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:justify-end">
          {actions}
        </div>
      ) : null}
    </header>
  );
}
