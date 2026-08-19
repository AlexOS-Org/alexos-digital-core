import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Package, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/dailygear/PageHeader";
import { StatusBadge } from "@/components/dailygear/StatusBadge";
import { ProductFormDialog } from "@/components/dailygear/ProductFormDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeleteProduct, useProducts } from "@/lib/dailygear/api";
import { DG_CURRENCY, PRODUCT_STATUS_META } from "@/lib/dailygear/constants";
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
  const remove = useDeleteProduct();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);
  const [open, setOpen] = useState(false);

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
        <Card className="rounded-2xl border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <Package className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {products.length
                ? "No products match your search."
                : "Add your first product to start tracking revenue and stock."}
            </p>
          </CardContent>
        </Card>
      )}

      {!isLoading && filtered.length > 0 && (
        <Card className="rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Price</th>
                  <th className="px-4 py-3 font-medium text-right">Cost</th>
                  <th className="px-4 py-3 font-medium text-right">Stock</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const low = Number(p.stock_quantity) <= Number(p.low_stock_threshold);
                  return (
                    <tr key={p.id} className="border-t border-border/70">
                      <td className="px-4 py-3">
                        <p className="font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.sku ?? "No SKU"}</p>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge meta={PRODUCT_STATUS_META[p.status ?? "draft"]} />
                      </td>
                      <td className="px-4 py-3 text-right">{money(Number(p.price))}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {money(Number(p.cost_price))}
                      </td>
                      <td
                        className={`px-4 py-3 text-right ${low ? "text-destructive font-medium" : ""}`}
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
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => remove.mutate(p.id)}>
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

      <ProductFormDialog open={open} onOpenChange={setOpen} product={editing} />
    </div>
  );
}
