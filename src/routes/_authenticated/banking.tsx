import { createFileRoute } from "@tanstack/react-router";
import { ModuleWorkbench } from "@/components/modules/ModuleWorkbench";

export const Route = createFileRoute("/_authenticated/banking")({
  component: () => <ModuleWorkbench mode="banking" />,
});
