import { createFileRoute } from "@tanstack/react-router";
import { NoveraWorkspacePage } from "@/components/novera/NoveraWorkspacePage";

export const Route = createFileRoute("/_authenticated/businesses/novera/customers")({
  component: () => <NoveraWorkspacePage module="Customers" />,
});
