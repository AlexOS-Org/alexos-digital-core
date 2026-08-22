import { Link, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  Boxes,
  FileSearch,
  Gem,
  LayoutDashboard,
  Megaphone,
  Package,
  Settings,
  ShoppingCart,
  Store,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const NOVERA_CONFIG = {
  slug: "novera",
  name: "Novera",
  description:
    "A separate business workspace for Novera operations, growth, and customer experience.",
  supportEmail: null,
  supportPhone: null,
  whatsapp: null,
  metaPixelId: null,
  sourceDescription: null,
} as const;

const MODULES = [
  { path: "/businesses/novera", label: "Overview", icon: LayoutDashboard, exact: true },
  { path: "/businesses/novera/products", label: "Products", icon: Package },
  { path: "/businesses/novera/orders", label: "Orders", icon: ShoppingCart },
  { path: "/businesses/novera/customers", label: "Customers", icon: Users },
  { path: "/businesses/novera/inventory", label: "Inventory", icon: Boxes },
  { path: "/businesses/novera/funnels", label: "Funnels", icon: Store },
  { path: "/businesses/novera/marketing", label: "Marketing", icon: Megaphone },
  { path: "/businesses/novera/reports", label: "Reports", icon: BarChart3 },
  { path: "/businesses/novera/evidence", label: "Sources", icon: FileSearch },
  { path: "/businesses/novera/settings", label: "Settings", icon: Settings },
] as const;

const CONFIG_FIELDS = [
  ["Support email", NOVERA_CONFIG.supportEmail],
  ["Phone", NOVERA_CONFIG.supportPhone],
  ["WhatsApp", NOVERA_CONFIG.whatsapp],
  ["Meta Pixel ID", NOVERA_CONFIG.metaPixelId],
  ["Information source", NOVERA_CONFIG.sourceDescription],
] as const;

export function NoveraWorkspacePage({ module = "Overview" }: { module?: string }) {
  const pathname = useRouterState({ select: (router) => router.location.pathname });
  const isOverview = module === "Overview";
  const configuredCount = CONFIG_FIELDS.filter(([, value]) => Boolean(value)).length;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-10 3xl:max-w-[1720px] 4k:max-w-[2400px]">
      <section className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-card/85 p-6 shadow-[0_24px_70px_-38px_var(--alexos-glow)] sm:p-8">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_90%_10%,color-mix(in_oklch,var(--alexos-purple)_24%,transparent),transparent_42%),radial-gradient(circle_at_10%_100%,color-mix(in_oklch,var(--alexos-blue)_16%,transparent),transparent_38%)]" />
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-[0_12px_30px_-20px_var(--alexos-glow)]">
              <Gem className="h-7 w-7" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                Novera workspace
              </p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
                {isOverview ? NOVERA_CONFIG.name : module}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                {NOVERA_CONFIG.description}
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="rounded-full px-3 py-1">
            {configuredCount}/5 configured
          </Badge>
        </div>
      </section>

      <nav
        className="grid grid-cols-2 gap-2 sm:grid-cols-5 lg:grid-cols-10"
        aria-label="Novera workspace navigation"
      >
        {MODULES.map((item) => {
          const Icon = item.icon;
          const active = item.exact ? pathname === item.path : pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path as never}
              className={cn(
                "flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl border px-2 py-2 text-center text-xs font-medium transition-colors",
                active
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-border/60 bg-card/70 text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {isOverview ? (
        <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
          <Card className="rounded-3xl border-border/60 bg-card/80">
            <CardContent className="p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                Workspace status
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">Ready for Novera data</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                The paths are separated from DailyGear. Products, orders, customers, marketing, and
                source evidence should be connected only after Novera’s real business identity and
                data source are confirmed.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  to="/businesses/novera/settings"
                  className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                >
                  Configure workspace
                </Link>
                <Link
                  to="/businesses/novera/evidence"
                  className="rounded-xl border border-border px-4 py-2 text-sm font-semibold"
                >
                  Add source evidence
                </Link>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-3xl border-border/60 bg-card/80">
            <CardContent className="p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Not copied from DailyGear
              </p>
              <h2 className="mt-2 text-xl font-semibold">Separate configuration boundary</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Novera will have its own Pixel ID, support contacts, catalogue evidence, campaign
                attribution, and business-scoped Auren context.
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="rounded-3xl border-border/60 bg-card/80">
          <CardContent className="p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              Novera · {module}
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">Module path created</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              This path is scoped to Novera and intentionally contains no DailyGear records. Connect
              the verified Novera data source before activating live operations.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
