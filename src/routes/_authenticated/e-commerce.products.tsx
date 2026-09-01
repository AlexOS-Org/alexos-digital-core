import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCategories,
  useDeleteProduct,
  useFunnels,
  useProductEvidence,
  useProducts,
  useSaveProduct,
  useVariants,
} from "@/lib/dailygear/api";
import { planBulkPublish } from "@/lib/dailygear/bulk-actions";
import {
  CATALOGUE_FILTER_OPTIONS,
  matchesCatalogueFilter,
  type CatalogueFilterKey,
} from "@/lib/dailygear/catalogue-filters";
import { DG_CURRENCY, PRODUCT_STATUS_META } from "@/lib/dailygear/constants";
import {
  assessProductReadiness,
  type ProductReadinessReason,
} from "@/lib/dailygear/product-readiness";
import { getProductReadiness } from "@/lib/dailygear/types";
import { productImage } from "@/lib/storefront/api";
import { isPremiumProduct } from "@/lib/storefront/premium";
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

const READINESS_REASON_LABELS: Record<ProductReadinessReason, string> = {
  missing_name: "Name required",
  missing_category: "Category required",
  missing_description: "Description required",
  missing_primary_image: "Primary image required",
  missing_seo_title: "SEO title required",
  missing_seo_description: "SEO description required",
  missing_price: "Price required before sale",
  missing_currency: "Currency required",
  missing_stock_configuration: "Stock configuration required",
  not_confirmed_available: "Availability evidence required",
  not_active: "Product must be active",
};

function ReadinessReasons({ reasons }: { reasons: ProductReadinessReason[] }) {
  if (reasons.length === 0) return null;
  return (
    <ul className="mt-1 space-y-0.5 text-[11px] text-muted-foreground">
      {reasons.map((reason) => (
        <li key={reason}>• {READINESS_REASON_LABELS[reason]}</li>
      ))}
    </ul>
  );
}

function ProductsPage() {
  const { data: products = [], isLoading } = useProducts();
  const { data: evidence = [] } = useProductEvidence();
  const { data: categories = [] } = useCategories();
  const { data: funnels = [] } = useFunnels();
  const { data: allVariants = [] } = useVariants();
  const remove = useDeleteProduct();
  const save = useSaveProduct();
  const [query, setQuery] = useState("");
  const [filterKey, setFilterKey] = useState<CatalogueFilterKey>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
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

  const funnelsByProduct = useMemo(() => {
    const byProduct = new Map<string, typeof funnels>();
    for (const funnel of funnels) {
      if (!funnel.product_id) continue;
      const list = byProduct.get(funnel.product_id) ?? [];
      list.push(funnel);
      byProduct.set(funnel.product_id, list);
    }
    return byProduct;
  }, [funnels]);

  const variantsByProduct = useMemo(() => {
    const byProduct = new Map<string, typeof allVariants>();
    for (const variant of allVariants) {
      const list = byProduct.get(variant.product_id) ?? [];
      list.push(variant);
      byProduct.set(variant.product_id, list);
    }
    return byProduct;
  }, [allVariants]);

  const bulkPlan = useMemo(() => {
    return planBulkPublish(
      products
        .filter((product) => selected.has(product.id))
        .map((product) => {
          const variants = variantsByProduct.get(product.id) ?? [];
          const validImages = (product.images ?? []).every(
            (url) => typeof url === "string" && /^https:\/\//.test(url.trim()),
          );
          return {
            id: product.id,
            input: {
              hasName: Boolean(product.name.trim()),
              hasCategory: Boolean(product.category_id),
              hasConfirmedAvailability: product.availability_confirmed === true,
              hasEvidence: (evidenceCounts.get(product.id) ?? 0) > 0,
              hasVariantReadiness: variants.every((variant) => variant.availability_confirmed),
              hasValidImageUrls: validImages,
              hasSellablePrice: Number(product.price) > 0,
            },
          };
        }),
    );
  }, [products, selected, variantsByProduct, evidenceCounts]);

  function toggleSelected(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function publishSelectedEligible() {
    const eligible = bulkPlan.eligible;
    if (eligible.length === 0) {
      toast.info("No selected product met the catalogue readiness rules. Nothing published.");
      return;
    }
    let published = 0;
    for (const item of eligible) {
      try {
        await save.mutateAsync({ id: item.id, status: "active" });
        published += 1;
      } catch {
        // Leave untouched; the row's readiness reason will still show on reload.
      }
    }
    if (bulkPlan.skipped.length > 0) {
      toast.info(
        `${bulkPlan.skipped.length} product(s) skipped because they are not catalogue-ready.`,
      );
    }
    toast.success(`${published} product(s) published to the catalogue.`);
    setSelected(new Set());
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q) && !(p.sku ?? "").toLowerCase().includes(q)) {
        return false;
      }
      if (filterKey === "all") return true;
      const readiness = assessProductReadiness(p);
      const price = Number(p.price);
      const stock = Number(p.stock_quantity);
      const lowStock = stock > 0 && stock <= Number(p.low_stock_threshold);
      const premium = isPremiumProduct(p);
      return matchesCatalogueFilter(
        {
          status: p.status,
          price,
          stock,
          lowStock,
          premium,
          hasFunnel: Boolean(funnelsByProduct.get(p.id)?.length),
          catalogueReady: readiness.catalogueReady,
          salesReady: readiness.salesReady,
          missingPrice: readiness.reasons.includes("missing_price"),
        },
        filterKey,
      );
    });
  }, [products, query, filterKey, funnelsByProduct]);

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

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by name or SKU"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="w-full sm:max-w-[200px]">
          <Select
            value={filterKey}
            onValueChange={(value) => setFilterKey(value as CatalogueFilterKey)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter products" />
            </SelectTrigger>
            <SelectContent>
              {CATALOGUE_FILTER_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selected.size > 0 ? (
        <div className="flex flex-col gap-3 rounded-xl border border-primary/20 bg-primary/[0.06] p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm">
            <span className="font-medium">{selected.size} selected</span>
            <span className="text-muted-foreground">
              {" "}
              · {bulkPlan.eligible.length} eligible · {bulkPlan.skipped.length} skipped
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={publishSelectedEligible}
              disabled={bulkPlan.eligible.length === 0 || save.isPending}
            >
              <CheckCircle2 className="mr-1 h-4 w-4" />
              Publish eligible
            </Button>
            <Button size="sm" variant="outline" onClick={() => setSelected(new Set())}>
              Clear selection
            </Button>
          </div>
        </div>
      ) : null}

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
                  <th className="px-4 py-3">
                    <Checkbox
                      checked={filtered.length > 0 && filtered.every((p) => selected.has(p.id))}
                      onCheckedChange={(checked) => {
                        setSelected(
                          checked ? new Set(filtered.map((p) => p.id)) : new Set<string>(),
                        );
                      }}
                      aria-label="Select all visible products"
                    />
                  </th>
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
                        <Checkbox
                          checked={selected.has(p.id)}
                          onCheckedChange={() => toggleSelected(p.id)}
                          aria-label={`Select ${p.name}`}
                        />
                      </td>
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
                        {(funnelsByProduct.get(p.id) ?? []).length > 0 ? (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {(funnelsByProduct.get(p.id) ?? []).map((funnel) => (
                              <Link
                                key={funnel.id}
                                to="/funnel/$slug"
                                params={{ slug: funnel.slug }}
                                className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                              >
                                <ArrowRight className="h-3 w-3" />
                                {funnel.name || funnel.slug}
                              </Link>
                            ))}
                          </div>
                        ) : null}
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
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {evidenceCounts.get(p.id) ?? 0} verified source record
                          {evidenceCounts.get(p.id) === 1 ? "" : "s"}
                        </p>
                        {!commerceReadiness.salesReady ? (
                          <ReadinessReasons reasons={commerceReadiness.reasons} />
                        ) : null}
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
