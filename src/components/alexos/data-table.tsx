import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * The AlexOS table shell.
 *
 * Wraps the table primitives with the things every admin table needs and none
 * of them were doing consistently: a bordered surface, a toolbar row for
 * search and filters, an explicit result count, a horizontal scroll affordance
 * on narrow viewports, and dedicated slots for loading and empty states so no
 * screen has to reinvent them.
 */
export function AlexOSDataTable({
  children,
  toolbar,
  footer,
  empty,
  loading,
  isLoading = false,
  minWidth = 640,
  className,
  label,
}: {
  children?: ReactNode;
  toolbar?: ReactNode;
  footer?: ReactNode;
  empty?: ReactNode;
  loading?: ReactNode;
  isLoading?: boolean;
  minWidth?: number;
  className?: string;
  /** Accessible name for the region, e.g. "Transactions". */
  label?: string;
}) {
  return (
    <section aria-label={label} className={cn("alexos-table-shell", className)}>
      {toolbar ? (
        <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          {toolbar}
        </div>
      ) : null}

      {isLoading ? (
        <div className="p-4">{loading}</div>
      ) : (
        <div className="alexos-table-scroll" style={{ overflowX: "auto" }}>
          <div style={{ minWidth }} className="w-full">
            {children}
          </div>
        </div>
      )}

      {!isLoading && empty ? <div className="p-4">{empty}</div> : null}
      {footer ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-2.5 text-sm text-muted-foreground">
          {footer}
        </div>
      ) : null}
    </section>
  );
}

/** Toolbar cluster: search on the left, filters/actions on the right. */
export function AlexOSTableToolbar({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex w-full flex-wrap items-center gap-2", className)}>{children}</div>
  );
}
