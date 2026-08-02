import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Boxes,
  Minus,
  Package,
  Plus,
  Search,
  Wallet,
} from "lucide-react";
import { PageHeader } from "@/components/dailygear/PageHeader";
import { KpiCard } from "@/components/dailygear/KpiCard";
import { StatusBadge } from "@/components/dailygear/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useCommerceData } from "@/lib/dailygear/useCommerceData";
import { useSaveStockMovement } from "@/lib/dailygear/api";
import {
  DEAD_STOCK_DAYS,
  DG_CURRENCY,
  PRODUCT_STATUS_META,
  STOCK_MOVEMENT_LABELS,
} from "@/lib/dailygear/constants";
import type { Product, StockMovementType } from "@/lib/dailygear/types";

export const Route = createFileRoute("/_authenticated/e-commerce/inventory")({
  head: () => ({
    meta: [
      { title: "Inventory | DailyGear" },
      { name: "description", content: "Stock levels, movements, reorder and dead-stock signals." },
      { property: "og:title", content: "Inventory | DailyGear" },
      { property: "og:description", content: "Stock levels, movements, reorder and dead-stock signals." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: InventoryPage,
});

const money = (v: number) =>
  `${DG_CURRENCY} ${Number(v ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

const num = (v: unknown) => (typeof v === "number" ? v : Number(v ?? 0)) || 0;

/** Movement types that add stock */
const INBOUND_TYPES: StockMovementType[] = ["purchase", "return", "adjustment", "transfer_in"];
/** Movement types that remove stock */
const OUTBOUND_TYPES: StockMovementType[] = ["damage", "transfer_out"];

// Adjustment-only types shown in the dialog (sale is handled via Orders)
const ADJUSTMENT_TYPES: { type: StockMovementType; label: string; direction: "in" | "out" }[] = [
  { type: "purchase", label: "Purchase (stock in)", direction: "in" },
  { type: "return", label: "Customer return (stock in)", direction: "in" },
  { type: "adjustment", label: "Manual adjustment (in)", direction: "in" },
  { type: "damage", label: "Damage / loss (stock out)", direction: "out" },
  { type: "transfer_out", label: "Transfer out", direction: "out" },
];

/* ── Stock adjustment dialog ──────────────────────────────────── */

interface AdjustDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

function StockAdjustDialog({ product, open, onOpenChange }: AdjustDialogProps) {
  const save = useSaveStockMovement();
  const [movementType, setMovementType] = useState<StockMovementType>("purchase");
  const [qty, setQty] = useState("");
  const [ref, setRef] = useState("");

  useEffect(() => {
    if (open) {
      setMovementType("purchase");
      setQty("");
      setRef("");
    }
  }, [open]);

  const parsed = parseInt(qty, 10);
  const invalid = !product || isNaN(parsed) || parsed <= 0;

  const direction = ADJUSTMENT_TYPES.find((t) => t.type === movementType)?.direction ?? "in";

  async function submit() {
    if (invalid || !product) return;
    await save.mutateAsync({
      product_id: product.id,
      type: movementType,
      quantity: direction === "in" ? parsed : -parsed,
      unit_cost: num(product.cost_price),
      reference: ref.trim() || null,
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust stock — {product?.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Movement type</Label>
            <Select
              value={movementType}
              onValueChange={(v) => setMovementType(v as StockMovementType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ADJUSTMENT_TYPES.map((t) => (
                  <SelectItem key={t.type} value={t.type}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>
              Quantity{" "}
              <span className="text-xs text-muted-foreground">
                ({direction === "in" ? "added to stock" : "removed from stock"})
              </span>
            </Label>
            <Input
              type="number"
              min={1}
              placeholder="e.g. 10"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Reference / note (optional)</Label>
            <Input
              placeholder="e.g. PO-2026-001 or supplier name"
              value={ref}
              onChange={(e) => setRef(e.target.value)}
            />
          </div>

          <div className="rounded-xl border border-border/60 bg-muted/40 p-3 text-xs text-muted-foreground">
            Current stock: <span className="font-semibold text-foreground">{product?.stock_quantity ?? 0}</span>
            {!invalid && (
              <>
                {" → "}
                <span className="font-semibold text-foreground">
                  {Math.max(0, num(product?.stock_quantity) + (direction === "in" ? parsed : -parsed))}
                </span>
              </>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={invalid || save.isPending}>
            {save.isPending ? "Saving…" : "Record movement"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Main page ────────────────────────────────────────────────── */

function InventoryPage() {
  const { products, movements, isLoading } = useCommerceData();
  const [query, setQuery] = useState("");
  const [adjustTarget, setAdjustTarget] = useState<Product | null>(null);
  const [adjustOpen, setAdjustOpen] = useState(false);

  /** Products that have had no outbound sale movement in the last DEAD_STOCK_DAYS days. */
  const deadStockIds = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - DEAD_STOCK_DAYS);
    const recentlySold = new Set(
      movements
        .filter((m) => m.type === "sale" && new Date(m.created_at) >= cutoff && m.product_id)
        .map((m) => m.product_id!),
    );
    return new Set(
      products
        .filter((p) => p.status === "active" && num(p.stock_quantity) > 0 && !recentlySold.has(p.id))
        .map((p) => p.id),
    );
  }, [products, movements]);

  const summary = useMemo(() => {
    const active = products.filter((p) => p.status === "active");
    const lowStock = active.filter(
      (p) => num(p.stock_quantity) <= num(p.low_stock_threshold) && num(p.stock_quantity) > 0,
    ).length;
    const outOfStock = products.filter((p) => p.status === "out_of_stock" || num(p.stock_quantity) === 0).length;
    const inventoryValue = active.reduce(
      (s, p) => s + num(p.cost_price) * num(p.stock_quantity),
      0,
    );
    return { total: active.length, lowStock, outOfStock, deadStock: deadStockIds.size, inventoryValue };
  }, [products, deadStockIds]);

  /** Sort: out-of-stock → low stock → dead stock → normal */
  const sorted = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? products.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            (p.sku ?? "").toLowerCase().includes(q),
        )
      : [...products];
    return list.sort((a, b) => {
      const priority = (p: Product) => {
        if (num(p.stock_quantity) === 0 || p.status === "out_of_stock") return 0;
        if (num(p.stock_quantity) <= num(p.low_stock_threshold)) return 1;
        if (deadStockIds.has(p.id)) return 2;
        return 3;
      };
      return priority(a) - priority(b);
    });
  }, [products, query, deadStockIds]);

  function openAdjust(p: Product) {
    setAdjustTarget(p);
    setAdjustOpen(true);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory"
        description="Stock levels, movements, reorder signals and dead-stock alerts."
      />

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Active SKUs"
          value={summary.total}
          icon={Boxes}
          loading={isLoading}
        />
        <KpiCard
          label="Low stock"
          value={summary.lowStock}
          icon={AlertTriangle}
          tone={summary.lowStock > 0 ? "warning" : "default"}
          hint={summary.lowStock > 0 ? "Reorder soon" : "All stock levels healthy"}
          loading={isLoading}
        />
        <KpiCard
          label="Dead stock"
          value={summary.deadStock}
          icon={Package}
          tone={summary.deadStock > 0 ? "warning" : "default"}
          hint={`No sales in ${DEAD_STOCK_DAYS}+ days`}
          loading={isLoading}
        />
        <KpiCard
          label="Inventory value"
          value={money(summary.inventoryValue)}
          icon={Wallet}
          loading={isLoading}
        />
      </div>

      {/* Dead-stock signal banner */}
      {!isLoading && summary.deadStock > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <p className="text-sm text-amber-700 dark:text-amber-300">
            <span className="font-semibold">{summary.deadStock} items</span> have had no sales in
            the last {DEAD_STOCK_DAYS} days. Consider discounting, bundling, or returning to supplier.
          </p>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search by name or SKU…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {isLoading && <Skeleton className="h-72 w-full rounded-2xl" />}

      {!isLoading && sorted.length === 0 && (
        <Card className="rounded-2xl border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <Boxes className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {products.length
                ? "No products match your search."
                : "Add products to start tracking inventory levels."}
            </p>
          </CardContent>
        </Card>
      )}

      {!isLoading && sorted.length > 0 && (
        <Card className="rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Stock</th>
                  <th className="px-4 py-3 font-medium text-right">Threshold</th>
                  <th className="px-4 py-3 font-medium text-right">Value</th>
                  <th className="px-4 py-3 font-medium">Signals</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {sorted.map((p) => {
                  const stock = num(p.stock_quantity);
                  const threshold = num(p.low_stock_threshold);
                  const isLow = stock <= threshold && stock > 0;
                  const isOut = stock === 0 || p.status === "out_of_stock";
                  const isDead = deadStockIds.has(p.id);
                  const value = num(p.cost_price) * stock;
                  return (
                    <tr key={p.id} className="border-t border-border/70 hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <p className="font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.sku ?? "No SKU"}</p>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge meta={PRODUCT_STATUS_META[p.status]} />
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-semibold ${
                          isOut
                            ? "text-destructive"
                            : isLow
                              ? "text-amber-500"
                              : "text-foreground"
                        }`}
                      >
                        {stock}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {threshold > 0 ? threshold : "—"}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {value > 0 ? money(value) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {isOut && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive">
                              <Minus className="h-2.5 w-2.5" /> Out
                            </span>
                          )}
                          {isLow && !isOut && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                              <AlertTriangle className="h-2.5 w-2.5" /> Low
                            </span>
                          )}
                          {isDead && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                              Dead stock
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs"
                          onClick={() => openAdjust(p)}
                        >
                          <Plus className="mr-1 h-3 w-3" />
                          Adjust
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <StockAdjustDialog
        product={adjustTarget}
        open={adjustOpen}
        onOpenChange={setAdjustOpen}
      />
    </div>
  );
}
