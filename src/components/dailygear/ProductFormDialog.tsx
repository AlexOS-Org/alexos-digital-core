import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
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
import {
  useBrands,
  useCategories,
  useSaveProduct,
  useSuppliers,
  useVariants,
} from "@/lib/dailygear/api";
import type { Product, ProductStatus } from "@/lib/dailygear/types";

const EMPTY = {
  name: "",
  slug: "",
  sku: "",
  description: "",
  short_description: "",
  seo_title: "",
  seo_description: "",
  seo_keywords: "",
  image_alt_text: "",
  status: "draft" as ProductStatus,
  availability_confirmed: "false",
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
  evidenceCount = 0,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  product?: Product | null;
  evidenceCount?: number;
}) {
  const [form, setForm] = useState(EMPTY);
  const save = useSaveProduct();
  const { data: categories = [] } = useCategories();
  const { data: brands = [] } = useBrands();
  const { data: suppliers = [] } = useSuppliers();
  const { data: variants = [] } = useVariants(product?.id ? { product_id: product.id } : undefined);

  useEffect(() => {
    if (!open) return;
    setForm(
      product
        ? {
            name: product.name,
            slug: product.slug ?? "",
            sku: product.sku ?? "",
            description: product.description ?? "",
            short_description: product.short_description ?? "",
            seo_title: product.seo_title ?? "",
            seo_description: product.seo_description ?? "",
            seo_keywords: (product.seo_keywords ?? []).join(", "),
            image_alt_text: product.image_alt_text ?? "",
            status: product.status ?? "draft",
            availability_confirmed: product.availability_confirmed ? "true" : "false",
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
    setForm((current) => ({ ...current, [key]: value }));
  const categoryNameById = new Map(categories.map((category) => [category.id, category.name]));

  const hasMinimumStock = Number(form.stock_quantity) >= 15;
  const hasConfirmedAvailability = form.availability_confirmed === "true";
  const hasCategory = Boolean(form.category_id);
  const hasEvidence = evidenceCount > 0;
  const incompleteVariants = variants.filter(
    (variant) => Number(variant.stock_quantity) < 15 || !variant.availability_confirmed,
  );
  const hasVariantReadiness = incompleteVariants.length === 0;
  const missingPublicationRequirements = [
    !hasMinimumStock ? "at least 15 units" : null,
    !hasConfirmedAvailability ? "confirmed availability" : null,
    !hasCategory ? "a primary category" : null,
    !hasEvidence ? "source evidence" : null,
    !hasVariantReadiness
      ? "every colour/SKU variant must have confirmed availability and at least 15 units"
      : null,
  ].filter((requirement): requirement is string => Boolean(requirement));
  const publicationBlocked = form.status === "active" && missingPublicationRequirements.length > 0;
  const invalid = !form.name.trim() || Number(form.price) <= 0 || publicationBlocked;

  async function submit(statusOverride?: ProductStatus) {
    const nextStatus = statusOverride ?? form.status;
    if (!form.name.trim() || Number(form.price) <= 0) return;
    if (nextStatus === "active" && missingPublicationRequirements.length > 0) return;
    await save.mutateAsync({
      ...(product ? { id: product.id } : {}),
      name: form.name.trim(),
      slug: form.slug.trim() || null,
      sku: form.sku.trim() || null,
      description: form.description.trim() || null,
      short_description: form.short_description.trim() || null,
      seo_title: form.seo_title.trim() || null,
      seo_description: form.seo_description.trim() || null,
      seo_keywords: form.seo_keywords
        .split(",")
        .map((keyword) => keyword.trim())
        .filter(Boolean),
      image_alt_text: form.image_alt_text.trim() || null,
      status: nextStatus,
      availability_confirmed: form.availability_confirmed === "true",
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
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? "Edit product" : "New product"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>Name</Label>
            <Input
              value={form.name}
              onChange={(e) => set("name")(e.target.value)}
              placeholder="Leather laptop backpack"
            />
          </div>

          <div className="space-y-2">
            <Label>Public slug</Label>
            <Input
              value={form.slug}
              onChange={(e) => set("slug")(e.target.value)}
              placeholder="leather-laptop-backpack"
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
            <Select value={form.status ?? "draft"} onValueChange={(value) => set("status")(value)}>
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
            <Label>Availability evidence</Label>
            <Select
              value={form.availability_confirmed}
              onValueChange={(value) => set("availability_confirmed")(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="false">Not confirmed</SelectItem>
                <SelectItem value="true">Confirmed from source</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Selling price</Label>
            <Input
              type="number"
              min="0"
              value={form.price}
              onChange={(e) => set("price")(e.target.value)}
              placeholder="0"
            />
          </div>

          <div className="space-y-2">
            <Label>Sale price (optional)</Label>
            <Input
              type="number"
              min="0"
              value={form.sale_price}
              onChange={(e) => set("sale_price")(e.target.value)}
              placeholder="0"
            />
          </div>

          <div className="space-y-2">
            <Label>Cost price</Label>
            <Input
              type="number"
              min="0"
              value={form.cost_price}
              onChange={(e) => set("cost_price")(e.target.value)}
              placeholder="0"
            />
          </div>

          <div className="space-y-2">
            <Label>Stock quantity</Label>
            <Input
              type="number"
              min="0"
              value={form.stock_quantity}
              onChange={(e) => set("stock_quantity")(e.target.value)}
              placeholder="0"
            />
          </div>

          <div className="space-y-2">
            <Label>Low stock alert at</Label>
            <Input
              type="number"
              min="0"
              value={form.low_stock_threshold}
              onChange={(e) => set("low_stock_threshold")(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={form.category_id || "none"}
              onValueChange={(value) => set("category_id")(value === "none" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Uncategorised" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Uncategorised</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.parent_id
                      ? `${categoryNameById.get(category.parent_id) ?? "Category"} / ${category.name}`
                      : category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Brand</Label>
            <Select
              value={form.brand_id || "none"}
              onValueChange={(value) => set("brand_id")(value === "none" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="No brand" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No brand</SelectItem>
                {brands.map((brand) => (
                  <SelectItem key={brand.id} value={brand.id}>
                    {brand.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Supplier</Label>
            <Select
              value={form.supplier_id || "none"}
              onValueChange={(value) => set("supplier_id")(value === "none" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="No supplier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No supplier</SelectItem>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>Short description</Label>
            <Textarea
              rows={2}
              value={form.short_description}
              onChange={(e) => set("short_description")(e.target.value)}
              placeholder="A concise, search-friendly product promise."
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>Description</Label>
            <Textarea
              rows={4}
              value={form.description}
              onChange={(e) => set("description")(e.target.value)}
              placeholder="Accurate product details, materials, fit, delivery and care information."
            />
          </div>

          <div className="rounded-2xl border border-border/70 bg-muted/30 p-4 sm:col-span-2">
            <p className="text-sm font-semibold">Search preview fields</p>
            <p className="mt-1 text-xs text-muted-foreground">
              These fields power page titles, descriptions, image alternatives and future structured
              data. Avoid unsupported claims or copied competitor language.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>SEO title</Label>
                <Input
                  value={form.seo_title}
                  onChange={(e) => set("seo_title")(e.target.value)}
                  placeholder="Leather Laptop Backpack | DailyGear Kenya"
                />
              </div>
              <div className="space-y-2">
                <Label>Image alt text</Label>
                <Input
                  value={form.image_alt_text}
                  onChange={(e) => set("image_alt_text")(e.target.value)}
                  placeholder="Black leather laptop backpack"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>SEO description</Label>
                <Textarea
                  rows={2}
                  value={form.seo_description}
                  onChange={(e) => set("seo_description")(e.target.value)}
                  placeholder="Describe the product accurately for Kenyan shoppers."
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>SEO keywords</Label>
                <Input
                  value={form.seo_keywords}
                  onChange={(e) => set("seo_keywords")(e.target.value)}
                  placeholder="laptop backpack, leather backpack, DailyGear Kenya"
                />
              </div>
            </div>
          </div>

          {publicationBlocked ? (
            <div className="flex gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm sm:col-span-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <div>
                <p className="font-semibold">
                  Publication is blocked until the catalogue is ready.
                </p>
                <p className="mt-1 text-muted-foreground">
                  An active product needs {missingPublicationRequirements.join(", ")}. Keep it as a
                  draft until the source, category, variant availability and stock are verified.
                  {incompleteVariants.length > 0
                    ? ` ${incompleteVariants.length} child variant${incompleteVariants.length === 1 ? "" : "s"} still need attention.`
                    : ""}
                </p>
              </div>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {publicationBlocked ? (
            <Button variant="secondary" onClick={() => submit("draft")} disabled={save.isPending}>
              Save as draft
            </Button>
          ) : null}
          <Button onClick={() => submit()} disabled={invalid || save.isPending}>
            {save.isPending ? "Saving…" : "Save product"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
