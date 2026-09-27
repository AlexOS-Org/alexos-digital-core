import type { ReactNode } from "react";

import { AlexOSPageHeader } from "@/components/alexos/page-header";

/**
 * DailyGear keeps its own name for the shared page header, but the rendering
 * lives in `AlexOSPageHeader` so store screens and the rest of the admin agree
 * on title scale, description rhythm, and action placement.
 */
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return <AlexOSPageHeader title={title} description={description} actions={actions} />;
}
