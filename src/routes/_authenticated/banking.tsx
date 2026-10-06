import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/banking")({
  component: BankingLayout,
});

function BankingLayout() {
  return <Outlet />;
}
