import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/money-center")({
  component: MoneyCenterLayout,
});

function MoneyCenterLayout() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="animate-in fade-in duration-300">
        <Outlet />
      </div>
    </div>
  );
}
