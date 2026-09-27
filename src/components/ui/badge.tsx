import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * AlexOS badge.
 *
 * Built on the shared `alexos-badge` base so geometry, casing and spacing are
 * identical everywhere. Prefer {@link AlexOSStatusBadge} for anything that
 * represents a business status — this component is for category and filter
 * chips.
 */
const badgeVariants = cva("alexos-badge", {
  variants: {
    variant: {
      default: "",
      secondary: "bg-muted text-muted-foreground border-border",
      outline: "alexos-badge-outline",
      success: "bg-success/12 text-success border-success/30",
      warning: "bg-alexos-amber/12 text-alexos-amber border-alexos-amber/30",
      destructive: "bg-destructive/12 text-destructive border-destructive/30",
      info: "bg-alexos-blue/12 text-alexos-blue border-alexos-blue/30",
      income: "bg-alexos-green/12 text-alexos-green border-alexos-green/30",
      expense: "bg-alexos-coral/12 text-alexos-coral border-alexos-coral/30",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
