import { createFileRoute, Outlet } from "@tanstack/react-router";
import { DailyGearNav } from "@/components/dailygear/DailyGearNav";
import { BusinessMobileNav } from "@/components/dailygear/mobile/BusinessMobileNav";

export const Route = createFileRoute("/_authenticated/e-commerce")({
  component: DailyGearLayout,
});

function DailyGearLayout() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 3xl:max-w-[1720px] 4k:max-w-[2400px]">
      <div className="hidden md:block">
        <DailyGearNav />
      </div>
      <div className="animate-in fade-in duration-300">
        <Outlet />
      </div>
      <BusinessMobileNav />
    </div>
  );
}
