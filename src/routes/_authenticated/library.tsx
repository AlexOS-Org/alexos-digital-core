import { createFileRoute } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";
import { AlexOSRoadmapModule } from "@/components/alexos-roadmap-module";

export const Route = createFileRoute("/_authenticated/library")({
  component: LibraryPage,
  head: () => ({
    meta: [{ title: "Library · AlexOS" }],
  }),
});

function LibraryPage() {
  return (
    <AlexOSRoadmapModule
      title="Library"
      description="Documents, contracts, files and your business knowledge base — organised and always accessible."
      icon={BookOpen}
      statusLabel="Roadmap module"
    />
  );
}
