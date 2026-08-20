import { createFileRoute } from "@tanstack/react-router";
import { Brain } from "lucide-react";
import { AlexOSEmptyState } from "@/components/alexos-empty-state";

export const Route = createFileRoute("/_authenticated/auren")({
  component: AurenPage,
  head: () => ({
    meta: [{ title: "Auren · AlexOS" }],
  }),
});

function AurenPage() {
  return (
    <AlexOSEmptyState
      title="Auren"
      description="Auren will surface business signals and recommendations across your operations as live data sources are connected."
      icon={Brain}
      statusLabel="Auren layer expanding"
    />
  );
}
