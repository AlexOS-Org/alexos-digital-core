import { createFileRoute } from "@tanstack/react-router";
import { AurenPage } from "@/components/auren/AurenPage";

export const Route = createFileRoute("/_authenticated/auren")({
  component: AurenPage,
  head: () => ({
    meta: [{ title: "Auren · AlexOS" }],
  }),
});
