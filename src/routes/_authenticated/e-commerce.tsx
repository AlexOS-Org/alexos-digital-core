import { createFileRoute, Outlet } from "@tanstack/react-router";
import { DailyGearNav } from "@/components/dailygear/DailyGearNav";

export const Route = createFileRoute("/_authenticated/e-commerce")({
  component: DailyGearLayout,
});

function DailyGearLayout() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <DailyGearNav />
      <div className="animate-in fade-in duration-300">
        <Outlet />
      </div>
    </div>
  );
}
