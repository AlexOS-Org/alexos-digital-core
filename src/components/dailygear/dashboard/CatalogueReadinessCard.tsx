import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowUpRight,
  Boxes,
  CheckCircle2,
  PackagePlus,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Product } from "@/lib/dailygear/types";

export function CatalogueReadinessCard({
  products,
  loading,
}: {
  products: Product[];
  loading?: boolean;
}) {
  if (loading) return <Skeleton className="h-52 w-full rounded-[1.75rem]" />;
  const active = products.filter((product) => product.status === "active").length;
  const drafts = products.length - active;
  const needsReview = products.filter(
    (product) => !product.availability_confirmed || Number(product.stock_quantity) < 15,
  ).length;
  const progress = products.length ? Math.round((active / products.length) * 100) : 0;
  return (
    <Card className="group relative overflow-hidden rounded-[1.75rem] border-primary/20 bg-gradient-to-br from-card via-card to-primary/[0.07] shadow-[0_22px_60px_-36px_var(--alexos-glow)]">
      <div className="alexos-visual-strip absolute inset-x-0 top-0 h-1 opacity-90" />
      <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
      <CardContent className="relative p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/15">
              <Boxes className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                Catalogue readiness
              </p>
              <h2 className="mt-1 text-xl font-bold tracking-tight">
                {products.length
                  ? "Your catalogue at a glance"
                  : "Add the first real DailyGear product"}
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                {products.length
                  ? `${active} of ${products.length} product${products.length === 1 ? " is" : "s are"} active. Review the readiness gates before publishing new stock.`
                  : "Products are not seeded automatically. Add a current item with its evidence, price and stock so the store can stay trustworthy."}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button asChild className="rounded-xl">
              <Link to="/e-commerce/products">
                <PackagePlus className="mr-2 h-4 w-4" />
                {products.length ? "Manage products" : "Add first product"}
              </Link>
            </Button>
            <Button asChild variant="outline" className="rounded-xl">
              <Link to="/e-commerce/settings">
                Store settings
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
        {products.length === 0 ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <GateItem icon={ShieldCheck} label="Current source evidence" />
            <GateItem icon={Boxes} label="At least 15 units per variant" />
            <GateItem icon={CheckCircle2} label="Availability confirmed" />
          </div>
        ) : (
          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            <Metric label="Products" value={products.length} />
            <Metric label="Active" value={active} />
            <Metric label="Drafts" value={drafts} />
            <Metric label="Needs review" value={needsReview} />
          </div>
        )}
        {products.length > 0 && (
          <div className="mt-5 rounded-2xl border border-border/60 bg-background/45 p-3.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-muted-foreground">Publication progress</span>
              <span className="font-semibold text-primary">{progress}% active</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary via-[var(--alexos-blue)] to-[var(--alexos-purple)]"
                style={{ width: `${progress}%` }}
              />
            </div>
            {needsReview > 0 && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-300">
                <AlertTriangle className="h-3.5 w-3.5" />
                {needsReview} item{needsReview === 1 ? " needs" : "s need"} evidence or the 15-unit
                gate reviewed.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/45 px-3.5 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

function GateItem({ icon: Icon, label }: { icon: typeof Boxes; label: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-2xl border border-border/60 bg-background/45 px-3 py-3 text-xs font-medium">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <span>{label}</span>
    </div>
  );
}
