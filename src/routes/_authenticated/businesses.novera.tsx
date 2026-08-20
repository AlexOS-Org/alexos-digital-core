import { createFileRoute } from "@tanstack/react-router";
import { Gem } from "lucide-react";
import { AlexOSEmptyState } from "@/components/alexos-empty-state";

export const Route = createFileRoute("/_authenticated/businesses/novera")({
  component: NoveraPage,
  head: () => ({
    meta: [{ title: "Novera · AlexOS" }],
  }),
});

function NoveraPage() {
  return (
    <AlexOSEmptyState
      title="Novera"
      description="BF business operations and growth for Novera. Connect live workspace data to bring this view online."
      icon={Gem}
      statusLabel="Workspace preparing"
    />
  );
}
