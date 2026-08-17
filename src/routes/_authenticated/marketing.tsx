import { createFileRoute } from "@tanstack/react-router";
import { ModuleWorkbench } from "@/components/modules/ModuleWorkbench";

export const Route = createFileRoute("/_authenticated/marketing")({
  component: () => <ModuleWorkbench mode="marketing" />,
});
