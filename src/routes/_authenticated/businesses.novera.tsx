import { createFileRoute } from "@tanstack/react-router";
import { Gem } from "lucide-react";
import { AlexOSEmptyState } from "@/components/alexos-empty-state";

export const Route = createFileRoute("/_authenticated/businesses/novera")({
  component: NuvoraPage,
  head: () => ({
    meta: [{ title: "Nuvora · AlexOS" }],
  }),
});

function NuvoraPage() {
  return (
    <AlexOSEmptyState
      title="Nuvora"
      description="Business operations and growth for Nuvora. Connect live workspace data to bring this view online."
      icon={Gem}
      statusLabel="Workspace preparing"
    />
  );
}
