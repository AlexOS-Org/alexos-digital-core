import { createFileRoute } from "@tanstack/react-router";
import { Brain } from "lucide-react";
import { AlexOSEmptyState } from "@/components/alexos-empty-state";

export const Route = createFileRoute("/_authenticated/auren")({
  component: AurenPage,
  head: () => ({
    meta: [{ title: "Auren Intelligence · AlexOS" }],
  }),
});

function AurenPage() {
  return (
    <AlexOSEmptyState
      title="Auren Intelligence"
      description="Business signals, recommendations and intelligence across all your operations — surfaced when they matter."
      icon={Brain}
      statusLabel="Intelligence layer expanding"
    />
  );
}
