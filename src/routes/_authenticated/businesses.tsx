import { createFileRoute } from "@tanstack/react-router";
import { Gem } from "lucide-react";
import { AlexOSEmptyState } from "@/components/alexos-empty-state";

export const Route = createFileRoute("/_authenticated/businesses")({
  component: BusinessesPage,
  head: () => ({
    meta: [{ title: "Nuvora · AlexOS" }],
  }),
});

function BusinessesPage() {
  return (
    <AlexOSEmptyState
      title="Nuvora"
      description="Business operations, performance and growth intelligence for Nuvora."
      icon={Gem}
      statusLabel="Workspace preparing"
    />
  );
}
