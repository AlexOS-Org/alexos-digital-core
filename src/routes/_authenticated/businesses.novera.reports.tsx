import { createFileRoute } from "@tanstack/react-router";
import { NoveraWorkspacePage } from "@/components/novera/NoveraWorkspacePage";

export const Route = createFileRoute("/_authenticated/businesses/novera/reports")({
  component: () => <NoveraWorkspacePage module="Reports" />,
});
