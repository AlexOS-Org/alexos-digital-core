import { createFileRoute } from "@tanstack/react-router";
import { Gem } from "lucide-react";
import { AlexOSRoadmapModule } from "@/components/alexos-roadmap-module";

export const Route = createFileRoute("/_authenticated/businesses/novera")({
  component: NuvoraPage,
  head: () => ({
    meta: [{ title: "Nuvora · AlexOS" }],
  }),
});

function NuvoraPage() {
  return (
    <AlexOSRoadmapModule
      title="Nuvora"
      description="Business operations and growth for Nuvora. Connect live workspace data to bring this view online."
      icon={Gem}
      statusLabel="Roadmap module"
    />
  );
}
