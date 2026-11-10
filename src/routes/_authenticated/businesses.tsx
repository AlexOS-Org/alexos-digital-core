import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2 } from "lucide-react";
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

function BusinessesPage() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 pb-10">
      <section className="alexos-mesh relative overflow-hidden rounded-[2rem] border border-primary/15 p-6 shadow-[0_24px_80px_-48px_var(--alexos-glow)] sm:p-8 lg:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Businesses</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Business workspaces
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
          No business workspaces are currently configured.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3" aria-label="Business workspaces">
        <Card className="rounded-xl border-border/60 bg-card/80">
          <CardContent className="flex h-full flex-col gap-5 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <Building2 className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold tracking-tight">No workspaces</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Add a business to see its workspace here.
              </p>
            </div>
            <Link to="/dashboard" className="text-xs font-semibold text-primary">
              Back to dashboard
            </Link>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
