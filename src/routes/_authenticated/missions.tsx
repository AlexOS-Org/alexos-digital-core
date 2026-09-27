import { createFileRoute } from "@tanstack/react-router";
import { Rocket } from "lucide-react";
import { AlexOSRoadmapModule } from "@/components/alexos-roadmap-module";

export const Route = createFileRoute("/_authenticated/missions")({
  component: MissionsPage,
  head: () => ({
    meta: [{ title: "Missions · AlexOS" }],
  }),
});

function MissionsPage() {
  return (
    <AlexOSRoadmapModule
      title="Missions"
      description="Strategic priorities, milestones and mission execution — connecting your goals to daily action."
      icon={Rocket}
      statusLabel="Roadmap module"
    />
  );
}
