import { createFileRoute, Outlet } from "@tanstack/react-router";
import { PeopleNav } from "@/components/crm/PeopleNav";

export const Route = createFileRoute("/_authenticated/people")({
  component: PeopleLayout,
});

function PeopleLayout() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PeopleNav />
      <div className="animate-in fade-in duration-300">
        <Outlet />
      </div>
    </div>
  );
}
