import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PRODUCT_STATUS_META } from "@/lib/dailygear/constants";
import { useBrands, useCategories, useSaveProduct, useSuppliers } from "@/lib/dailygear/api";
import type { Product, ProductStatus } from "@/lib/dailygear/types";

const EMPTY = {
  name: "",
  sku: "",
  description: "",
  status: "active" as ProductStatus,
  price: "",
  sale_price: "",
  cost_price: "",
  stock_quantity: "",
  low_stock_threshold: "5",
  category_id: "",
  brand_id: "",
  supplier_id: "",
};

export function ProductFormDialog({
  open,
  onOpenChange,
  product,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  product?: Product | null;
}) {
  const [form, setForm] = useState(EMPTY);
  const save = useSaveProduct();
  const { data: categories = [] } = useCategories();
  const { data: brands = [] } = useBrands();
  const { data: suppliers = [] } = useSuppliers();

  useEffect(() => {
    if (!open) return;
    setForm(
      product
        ? {
            name: product.name,
            sku: product.sku ?? "",
            description: product.description ?? "",
            status: product.status,
            price: String(product.price ?? ""),
            sale_price: product.sale_price != null ? String(product.sale_price) : "",
            cost_price: String(product.cost_price ?? ""),
            stock_quantity: String(product.stock_quantity ?? ""),
            low_stock_threshold: String(product.low_stock_threshold ?? 5),
            category_id: product.category_id ?? "",
            brand_id: product.brand_id ?? "",
            supplier_id: product.supplier_id ?? "",
          }
        : EMPTY,
    );
  }, [open, product]);

  const set = (key: keyof typeof EMPTY) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const invalid = !form.name.trim() || Number(form.price) <= 0;

  async function submit() {
    if (invalid) return;
    await save.mutateAsync({
      ...(product ? { id: product.id } : {}),
      name: form.name.trim(),
      sku: form.sku.trim() || null,
      description: form.description.trim() || null,
      status: form.status,
      price: Number(form.price) || 0,
      sale_price: form.sale_price ? Number(form.sale_price) : null,
      cost_price: Number(form.cost_price) || 0,
      stock_quantity: Number(form.stock_quantity) || 0,
      low_stock_threshold: Number(form.low_stock_threshold) || 0,
      category_id: form.category_id || null,
      brand_id: form.brand_id || null,
      supplier_id: form.supplier_id || null,
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? "Edit product" : "New product"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 space-y-2">
            <Label>Name</Label>
            <Input
              value={form.name}
              onChange={(e) => set("name")(e.target.value)}
              placeholder="Leather laptop backpack"
            />
          </div>

          <div className="space-y-2">
            <Label>SKU</Label>
            <Input
              value={form.sku}
              onChange={(e) => set("sku")(e.target.value)}
              placeholder="DG-BAG-001"
            />
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={form.status ?? "draft"} onValueChange={(v) => set("status")(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PRODUCT_STATUS_META).map(([value, meta]) => (
                  <SelectItem key={value} value={value}>
                    {meta.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Selling price</Label>
            <Input
              type="number"
              value={form.price}
              onChange={(e) => set("price")(e.target.value)}
              placeholder="0"
            />
          </div>

          <div className="space-y-2">
            <Label>Sale price (optional)</Label>
            <Input
              type="number"
              value={form.sale_price}
              onChange={(e) => set("sale_price")(e.target.value)}
              placeholder="0"
            />
          </div>

          <div className="space-y-2">
            <Label>Cost price</Label>
            <Input
              type="number"
              value={form.cost_price}
              onChange={(e) => set("cost_price")(e.target.value)}
              placeholder="0"
            />
          </div>

          <div className="space-y-2">
            <Label>Stock quantity</Label>
            <Input
              type="number"
              value={form.stock_quantity}
              onChange={(e) => set("stock_quantity")(e.target.value)}
              placeholder="0"
            />
          </div>

          <div className="space-y-2">
            <Label>Low stock alert at</Label>
            <Input
              type="number"
              value={form.low_stock_threshold}
              onChange={(e) => set("low_stock_threshold")(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={form.category_id || "none"}
              onValueChange={(v) => set("category_id")(v === "none" ? "" : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Uncategorised" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Uncategorised</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Brand</Label>
            <Select
              value={form.brand_id || "none"}
              onValueChange={(v) => set("brand_id")(v === "none" ? "" : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="No brand" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No brand</SelectItem>
                {brands.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Supplier</Label>
            <Select
              value={form.supplier_id || "none"}
              onValueChange={(v) => set("supplier_id")(v === "none" ? "" : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="No supplier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No supplier</SelectItem>
                {suppliers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="sm:col-span-2 space-y-2">
            <Label>Description</Label>
            <Textarea
              rows={3}
              value={form.description}
              onChange={(e) => set("description")(e.target.value)}
              placeholder="Sales copy shown on landing pages and product listings."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={invalid || save.isPending}>
            {save.isPending ? "Saving…" : "Save product"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
