import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Package,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/dailygear/PageHeader";
import { StatusBadge } from "@/components/dailygear/StatusBadge";
import { ProductFormDialog } from "@/components/dailygear/ProductFormDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCategories,
  useDeleteProduct,
  useProductEvidence,
  useProducts,
} from "@/lib/dailygear/api";
import { DG_CURRENCY, PRODUCT_STATUS_META } from "@/lib/dailygear/constants";
import { assessProductReadiness } from "@/lib/dailygear/product-readiness";
import { getProductReadiness } from "@/lib/dailygear/types";
import { productImage } from "@/lib/storefront/api";
import type { Product } from "@/lib/dailygear/types";

export const Route = createFileRoute("/_authenticated/e-commerce/products")({
  head: () => ({
    meta: [
      { title: "Products | DailyGear" },
      {
        name: "description",
        content: "Manage your DailyGear catalogue: pricing, cost, stock levels and suppliers.",
      },
      { property: "og:title", content: "Products | DailyGear" },
      {
        property: "og:description",
        content: "Manage your catalogue: pricing, cost, stock levels and suppliers.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProductsPage,
});

const money = (v: number) =>
  `${DG_CURRENCY} ${Number(v ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

function ProductsPage() {
  const { data: products = [], isLoading } = useProducts();
  const { data: evidence = [] } = useProductEvidence();
  const { data: categories = [] } = useCategories();
  const remove = useDeleteProduct();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);
  const [open, setOpen] = useState(false);

  const evidenceCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const record of evidence) {
      if (record.product_id && record.reconciliation_status === "verified")
        counts.set(record.product_id, (counts.get(record.product_id) ?? 0) + 1);
    }
    return counts;
  }, [evidence]);
  const categoryNames = useMemo(() => {
    const names = new Map(categories.map((category) => [category.id, category.name]));
    return new Map(
      categories.map((category) => [
        category.id,
        category.parent_id
          ? `${names.get(category.parent_id) ?? "Category"} / ${category.name}`
          : category.name,
      ]),
    );
  }, [categories]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || (p.sku ?? "").toLowerCase().includes(q),
    );
  }, [products, query]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Catalogue, pricing, cost, stock and supplier data."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            New product
          </Button>
        }
      />

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search by name or SKU"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {isLoading && <Skeleton className="h-64 w-full rounded-2xl" />}

      {!isLoading && filtered.length === 0 && (
        <Card className="relative overflow-hidden rounded-[1.75rem] border-primary/20 bg-gradient-to-br from-card via-card to-primary/[0.07] shadow-[0_22px_60px_-36px_var(--alexos-glow)]">
          <div className="alexos-visual-strip absolute inset-x-0 top-0 h-1 opacity-90" />
          <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
          <CardContent className="relative p-5 sm:p-8">
            {products.length ? (
              <div className="flex items-center gap-3">
                <Package className="h-6 w-6 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No products match your search.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/15">
                      <Package className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                        Current catalogue
                      </p>
                      <h2 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">
                        No current product records yet
                      </h2>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                        Add a real DailyGear item with its current price, source evidence, images
                        and stock. Historical ad names alone are not enough to publish a product.
                      </p>
                    </div>
                  </div>
                  <Button
                    className="shrink-0 rounded-xl"
                    onClick={() => {
                      setEditing(null);
                      setOpen(true);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add real product
                  </Button>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <SetupStep
                    icon={ClipboardCheck}
                    title="Verify the source"
                    detail="Current supplier or first-party record"
                  />
                  <SetupStep
                    icon={ShieldCheck}
                    title="Pass the stock gate"
                    detail="At least 15 units per SKU or colour variant"
                  />
                  <SetupStep
                    icon={CheckCircle2}
                    title="Publish with confidence"
                    detail="Availability, SEO copy and imagery confirmed"
                  />
                </div>

                <div className="flex flex-col gap-2 rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-amber-800 dark:text-amber-200">
                    Keep new items as drafts until every publication gate passes.
                  </p>
                  <Link
                    to="/e-commerce/settings"
                    className="inline-flex items-center text-xs font-semibold text-primary hover:underline"
                  >
                    Review store settings <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!isLoading && filtered.length > 0 && (
        <Card className="overflow-hidden rounded-2xl">
          <div className="overflow-x-auto">
            <table className="min-w-[760px] w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Readiness</th>
                  <th className="px-4 py-3 text-right font-medium">Price</th>
                  <th className="px-4 py-3 text-right font-medium">Cost</th>
                  <th className="px-4 py-3 text-right font-medium">Stock</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const low = Number(p.stock_quantity) <= Number(p.low_stock_threshold);
                  const readiness = getProductReadiness(p, evidenceCounts.get(p.id) ?? 0);
                  const commerceReadiness = assessProductReadiness(p);
                  const priceMissing = commerceReadiness.reasons.includes("missing_price");
                  const cannotSell =
                    !commerceReadiness.salesReady || !readiness.readyToPublish || priceMissing;
                  return (
                    <tr key={p.id} className="border-t border-border/70">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {productImage(p) ? (
                            <img
                              src={productImage(p) ?? undefined}
                              alt=""
                              aria-hidden="true"
                              width={48}
                              height={48}
                              loading="lazy"
                              className="h-12 w-12 shrink-0 rounded-xl border object-cover"
                            />
                          ) : (
                            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border bg-muted text-[10px] text-muted-foreground">
                              No image
                            </span>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium">{p.name}</p>
                            <p className="text-xs text-muted-foreground">{p.sku ?? "No SKU"}</p>
                          </div>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {categoryNames.get(p.category_id ?? "") ?? "Uncategorised"}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge meta={PRODUCT_STATUS_META[p.status ?? "draft"]} />
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium ${
                            !cannotSell
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                              : "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                          }`}
                        >
                          {!cannotSell ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : (
                            <AlertTriangle className="h-3 w-3" />
                          )}
                          {!cannotSell
                            ? "READY FOR SALE"
                            : commerceReadiness.catalogueReady
                              ? "CATALOGUE READY"
                              : "NOT READY"}
                        </span>
                        {priceMissing ? (
                          <p className="mt-1 text-[11px] font-medium text-destructive">
                            Price required before sale
                          </p>
                        ) : null}
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {evidenceCounts.get(p.id) ?? 0} verified source record
                          {evidenceCounts.get(p.id) === 1 ? "" : "s"}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-right">{money(Number(p.price))}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {money(Number(p.cost_price))}
                      </td>
                      <td
                        className={`px-4 py-3 text-right ${low ? "font-medium text-destructive" : ""}`}
                      >
                        {p.stock_quantity}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setEditing(p);
                              setOpen(true);
                            }}
                            aria-label={`Edit ${p.name}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => remove.mutate(p.id)}
                            aria-label={`Delete ${p.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <ProductFormDialog
        open={open}
        onOpenChange={setOpen}
        product={editing}
        evidenceCount={editing ? (evidenceCounts.get(editing.id) ?? 0) : 0}
      />
    </div>
  );
}

function SetupStep({
  icon: Icon,
  title,
  detail,
}: {
  icon: typeof ClipboardCheck;
  title: string;
  detail: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background/45 p-3.5">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}
