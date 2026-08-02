import { createFileRoute } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";
import { AlexOSEmptyState } from "@/components/alexos-empty-state";

export const Route = createFileRoute("/_authenticated/library")({
  component: LibraryPage,
  head: () => ({
    meta: [{ title: "Library · AlexOS" }],
  }),
});

function LibraryPage() {
  return (
    <AlexOSEmptyState
      title="Library"
      description="Documents, contracts, files and your business knowledge base — organised and always accessible."
      icon={BookOpen}
      statusLabel="Module foundation ready"
    />
  );
}
