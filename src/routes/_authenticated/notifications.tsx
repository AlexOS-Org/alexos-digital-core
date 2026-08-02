import { createFileRoute } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { AlexOSEmptyState } from "@/components/alexos-empty-state";

export const Route = createFileRoute("/_authenticated/notifications")({
  component: NotificationsPage,
  head: () => ({
    meta: [{ title: "Notifications · AlexOS" }],
  }),
});

function NotificationsPage() {
  return (
    <AlexOSEmptyState
      title="Notifications"
      description="Alerts, updates and signals from across your operating system — delivered when action is needed."
      icon={Bell}
      statusLabel="Module foundation ready"
    />
  );
}
