import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { ArrowUpRight, Car, Gem, ShoppingBag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/businesses")({
  component: BusinessesPage,
  head: () => ({
    meta: [
      { title: "Businesses · AlexOS" },
      {
        name: "description",
        content: "Choose a business workspace in AlexOS.",
      },
    ],
  }),
});

const businessWorkspaces = [
  {
    name: "Novera",
    description: "Business operations and growth workspace.",
    detail: "Open the workspace when its live operating data is connected.",
    href: "/businesses/novera",
    icon: Gem,
    accent: "from-violet-500/15 to-fuchsia-500/10 text-violet-600 dark:text-violet-300",
  },
  {
    name: "Car-Bar Motion.ke",
    description: "Vehicle sales, financing and inventory workspace.",
    detail: "Manage the vehicle operating workflow from one place.",
    href: "/vehicle-sales",
    icon: Car,
    accent: "from-cyan-500/15 to-blue-500/10 text-cyan-700 dark:text-cyan-300",
  },
  {
    name: "DailyGear",
    description: "Products, inventory, orders and online sales.",
    detail: "Run the Kenyan storefront and its operations from AlexOS.",
    href: "/e-commerce",
    icon: ShoppingBag,
    accent: "from-emerald-500/15 to-teal-500/10 text-emerald-700 dark:text-emerald-300",
  },
] as const;

function BusinessesPage() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const isNoveraWorkspace = pathname.startsWith("/businesses/novera");

  if (isNoveraWorkspace) {
    return (
      <div className="mx-auto w-full max-w-6xl pb-10">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 pb-10">
      <section className="alexos-mesh relative overflow-hidden rounded-[2rem] border border-primary/15 p-6 shadow-[0_24px_80px_-48px_var(--alexos-glow)] sm:p-8 lg:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Businesses</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Choose the workspace that moves today forward.
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
          AlexOS keeps each business in its own operating context while giving you one command
          center for priorities, money and action.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3" aria-label="Business workspaces">
        {businessWorkspaces.map((workspace) => {
          const Icon = workspace.icon;
          return (
            <Link key={workspace.href} to={workspace.href} className="group">
              <Card className="h-full rounded-3xl border-border/60 bg-card/80 transition-all duration-200 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5">
                <CardContent className="flex h-full flex-col gap-5 p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${workspace.accent}`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold tracking-tight">{workspace.name}</h2>
                    <p className="mt-2 text-sm leading-6 text-foreground/80">
                      {workspace.description}
                    </p>
                    <p className="mt-3 text-xs leading-5 text-muted-foreground">
                      {workspace.detail}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-primary">Open workspace</span>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
