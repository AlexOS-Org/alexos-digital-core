import { createFileRoute } from "@tanstack/react-router";
import { NoveraWorkspacePage } from "@/components/novera/NoveraWorkspacePage";

export const Route = createFileRoute("/_authenticated/businesses/novera")({
  component: NoveraWorkspacePage,
  head: () => ({
    meta: [
      { title: "Novera · AlexOS" },
      {
        name: "description",
        content: "Novera business operations and growth workspace.",
      },
    ],
  }),
});
