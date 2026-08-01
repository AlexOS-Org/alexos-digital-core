import { createFileRoute } from "@tanstack/react-router";
import { Rocket } from "lucide-react";
import { AlexOSEmptyState } from "@/components/alexos-empty-state";

export const Route = createFileRoute("/_authenticated/missions")({
  component: MissionsPage,
  head: () => ({
    meta: [{ title: "Missions · AlexOS" }],
  }),
});

function MissionsPage() {
  return (
    <AlexOSEmptyState
      title="Missions"
      description="Strategic priorities, milestones and mission execution — connecting your goals to daily action."
      icon={Rocket}
      statusLabel="Workspace preparing"
    />
  );
}
