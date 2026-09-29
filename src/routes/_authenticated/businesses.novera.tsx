import { createFileRoute } from "@tanstack/react-router";
import { Gem } from "lucide-react";
import { AlexOSRoadmapModule } from "@/components/alexos-roadmap-module";

export const Route = createFileRoute("/_authenticated/businesses/novera")({
  component: NoveraPage,
  head: () => ({
    meta: [{ title: "Novera · AlexOS" }],
  }),
});

function NoveraPage() {
  return (
    <AlexOSRoadmapModule
      title="Novera"
      description="Business operations and growth for Novera. Connect live workspace data to bring this view online."
      icon={Gem}
      statusLabel="Roadmap module"
    />
  );
}
