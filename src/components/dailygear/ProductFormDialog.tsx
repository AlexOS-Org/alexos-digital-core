import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Package } from "lucide-react";
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
  useSaveVariant,
  useSuppliers,
  useVariants,
} from "@/lib/dailygear/api";
import {
  canPublishToCatalogue,
  cataloguePublicationBlockers,
  normalizeCurrencyCode,
} from "@/lib/dailygear/catalogue-publish";
import {
  buildPremiumAttributes,
  premiumContentFromAttributes,
  premiumEnabledFromAttributes,
  type PremiumContentDraft,
} from "@/lib/dailygear/premium-content";
import { canActivateForSale } from "@/lib/dailygear/product-readiness";
import { buildVariantCommercialPayload } from "@/lib/dailygear/variant-commercial";
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
  currency: "KES",
  stock_quantity: "",
  low_stock_threshold: "5",
  category_id: "",
  brand_id: "",
  supplier_id: "",
  images: "",
  premium: "false",
  premiumHero: "",
  premiumImages: "",
  premiumFeatureImages: "",
  premiumLifestyleImages: "",
  premiumBenefits: "",
  premiumFeatures: "",
  premiumSpecs: "",
  premiumFaq: "",
};

const EMPTY_PREMIUM_CONTENT: PremiumContentDraft = {
  enabled: false,
  hero: "",
  images: "",
  featureImages: "",
  lifestyleImages: "",
  benefits: "",
  features: "",
  specs: "",
  faq: "",
};

function VariantEditor({ variants }: { variants: Array<Record<string, unknown>> }) {
  const saveVariant = useSaveVariant();
  const [drafts, setDrafts] = useState<
    Record<
      string,
      {
        color: string;
        sex: string;
        imageUrl: string;
        sku: string;
        stock: string;
        price: string;
        salePrice: string;
        costPrice: string;
        available: boolean;
      }
    >
  >({});

  function draftFor(variant: Record<string, unknown>) {
    const id = String(variant.id ?? "");
    const options = (
      variant.options && typeof variant.options === "object" ? variant.options : {}
    ) as Record<string, unknown>;
    return (
      drafts[id] ?? {
        color: String(variant.color ?? options.color ?? ""),
        sex: String(options.sex ?? "Unisex"),
        imageUrl: String(variant.image_url ?? ""),
        sku: String(variant.sku ?? ""),
        stock: String(variant.stock_quantity ?? "0"),
        price: variant.price != null ? String(variant.price) : "",
        salePrice: variant.sale_price != null ? String(variant.sale_price) : "",
        costPrice: variant.cost_price != null ? String(variant.cost_price) : "",
        available: variant.availability_confirmed === true,
      }
    );
  }

  function update(id: string, patch: Partial<ReturnType<typeof draftFor>>) {
    setDrafts((current) => ({
      ...current,
      [id]: { ...draftFor(variants.find((variant) => String(variant.id) === id) ?? {}), ...patch },
    }));
  }

  async function saveOne(variant: Record<string, unknown>) {
    const id = String(variant.id ?? "");
    const draft = draftFor(variant);
    const existingOptions =
      variant.options && typeof variant.options === "object"
        ? (variant.options as Record<string, unknown>)
        : {};
    await saveVariant.mutateAsync(buildVariantCommercialPayload(id, draft, existingOptions));
  }

  if (!variants.length) return null;
  return (
    <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 sm:col-span-2">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Colour and audience variants</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Edit each variant’s colour, sex/gender audience, external image, SKU, quantity, price,
            sale price, cost and customer visibility. Unavailable variants remain visible here but
            are hidden from the storefront.
          </p>
        </div>
        <span className="rounded-full bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary">
          {variants.length} variant{variants.length === 1 ? "" : "s"}
        </span>
      </div>
      <div className="mt-4 space-y-3">
        {variants.map((variant) => {
          const id = String(variant.id ?? "");
          const draft = draftFor(variant);
          return (
            <div
              key={id}
              className="grid gap-3 rounded-xl border border-border/60 bg-background/70 p-3 md:grid-cols-7 md:items-end"
            >
              <div className="flex items-center gap-3 md:col-span-2">
                {draft.imageUrl ? (
                  <img
                    src={draft.imageUrl}
                    alt={`${String(variant.name ?? "Variant")} avatar`}
                    loading="lazy"
                    className="h-16 w-16 rounded-lg border border-border/60 object-cover"
                  />
                ) : (
                  <div
                    className="grid h-16 w-16 shrink-0 place-items-center rounded-lg border border-dashed border-border/70 bg-muted/40 text-muted-foreground"
                    title="Variant thumbnail unavailable"
                    aria-label="Variant thumbnail unavailable"
                  >
                    <Package className="h-6 w-6" aria-hidden="true" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Avatar preview
                  </p>
                  <p className="mt-1 text-pretty text-xs leading-5 text-muted-foreground">
                    External URL only
                  </p>
                </div>
              </div>
              <div className="md:col-span-2">
                <Label className="text-xs">Variant name</Label>
                <p className="mt-1 text-sm font-medium">
                  {String(variant.name ?? "Unnamed variant")}
                </p>
              </div>
              <div>
                <Label className="text-xs">Colour</Label>
                <Input
                  value={draft.color}
                  onChange={(event) => update(id, { color: event.target.value })}
                  placeholder="Blue"
                />
              </div>
              <div>
                <Label className="text-xs">Sex / audience</Label>
                <Select value={draft.sex} onValueChange={(value) => update(id, { sex: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Unisex">Unisex</SelectItem>
                    <SelectItem value="Boy">Boy</SelectItem>
                    <SelectItem value="Girl">Girl</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Stock</Label>
                <Input
                  type="number"
                  min="0"
                  value={draft.stock}
                  onChange={(event) => update(id, { stock: event.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <Label className="text-xs">External variant image URL</Label>
                <Input
                  value={draft.imageUrl}
                  onChange={(event) => update(id, { imageUrl: event.target.value })}
                  placeholder="https://…"
                />
              </div>
              <div>
                <Label className="text-xs">SKU</Label>
                <Input
                  value={draft.sku}
                  onChange={(event) => update(id, { sku: event.target.value })}
                  placeholder="DG-YJ-BLU"
                />
              </div>
              <div className="flex items-center gap-2 md:col-span-2">
                <Button
                  type="button"
                  size="sm"
                  variant={draft.available ? "default" : "outline"}
                  onClick={() => update(id, { available: !draft.available })}
                >
                  {draft.available ? "Available to customers" : "Hidden / out of stock"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={saveVariant.isPending}
                  onClick={() => saveOne(variant)}
                >
                  Save variant
                </Button>
              </div>
              <div className="grid gap-3 rounded-xl border border-border/50 bg-muted/20 p-3 md:col-span-7 md:grid-cols-3">
                <div>
                  <Label className="text-xs">Variant price</Label>
                  <Input
                    type="number"
                    min="0"
                    value={draft.price}
                    onChange={(event) => update(id, { price: event.target.value })}
                    placeholder="Use product price"
                  />
                </div>
                <div>
                  <Label className="text-xs">Variant sale price (optional)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={draft.salePrice}
                    onChange={(event) => update(id, { salePrice: event.target.value })}
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <Label className="text-xs">Variant cost / COGS</Label>
                  <Input
                    type="number"
                    min="0"
                    value={draft.costPrice}
                    onChange={(event) => update(id, { costPrice: event.target.value })}
                    placeholder="Use product cost"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

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

  const premiumContent = useMemo(() => {
    if (!product) return EMPTY_PREMIUM_CONTENT;
    const existing = premiumContentFromAttributes(product.attributes);
    const enabled = premiumEnabledFromAttributes(product.attributes);
    return { ...existing, enabled };
  }, [product]);

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
            currency: normalizeCurrencyCode(product.currency),
            stock_quantity: String(product.stock_quantity ?? ""),
            low_stock_threshold: String(product.low_stock_threshold ?? 5),
            category_id: product.category_id ?? "",
            brand_id: product.brand_id ?? "",
            supplier_id: product.supplier_id ?? "",
            images: ((product.images ?? []) as string[]).join("\n"),
            premium: premiumEnabledFromAttributes(product.attributes) ? "true" : "false",
            premiumHero: premiumContent.hero,
            premiumImages: premiumContent.images,
            premiumFeatureImages: premiumContent.featureImages,
            premiumLifestyleImages: premiumContent.lifestyleImages,
            premiumBenefits: premiumContent.benefits,
            premiumFeatures: premiumContent.features,
            premiumSpecs: premiumContent.specs,
            premiumFaq: premiumContent.faq,
          }
        : EMPTY,
    );
  }, [open, product, premiumContent]);

  const set = (key: keyof typeof EMPTY) => (value: string) =>
    setForm((current) => ({ ...current, [key]: value }));
  const categoryNameById = new Map(categories.map((category) => [category.id, category.name]));

  const imageUrls = form.images
    .split(/\n|,/)
    .map((value) => value.trim())
    .filter(Boolean);
  const invalidImageUrls = imageUrls.filter((url) => {
    try {
      const parsed = new URL(url);
      return parsed.protocol !== "https:";
    } catch {
      return true;
    }
  });
  const hasConfirmedAvailability = form.availability_confirmed === "true";
  const hasCategory = Boolean(form.category_id);
  const hasEvidence = evidenceCount > 0;
  const incompleteVariants = variants.filter((variant) => !variant.availability_confirmed);
  const hasVariantReadiness = incompleteVariants.length === 0;
  const priceMissing = !canActivateForSale({ price: Number(form.price), sale_price: null });
  const catalogueInput = {
    hasName: Boolean(form.name.trim()),
    hasCategory,
    hasConfirmedAvailability,
    hasEvidence,
    hasVariantReadiness,
    hasValidImageUrls: invalidImageUrls.length === 0,
    hasSellablePrice: !priceMissing,
  };
  const publicationBlockers = cataloguePublicationBlockers(catalogueInput);
  const publicationBlocked = form.status === "active" && !canPublishToCatalogue(catalogueInput);
  const invalid = !form.name.trim() || publicationBlocked;

  async function submit(statusOverride?: ProductStatus) {
    const nextStatus = statusOverride ?? form.status;
    if (!form.name.trim()) return;
    if (nextStatus === "active" && !canPublishToCatalogue(catalogueInput)) return;
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
      currency: normalizeCurrencyCode(form.currency),
      stock_quantity: Number(form.stock_quantity) || 0,
      low_stock_threshold: Number(form.low_stock_threshold) || 0,
      category_id: form.category_id || null,
      brand_id: form.brand_id || null,
      supplier_id: form.supplier_id || null,
      images: imageUrls,
      attributes: buildPremiumAttributes(
        product?.attributes &&
          typeof product.attributes === "object" &&
          !Array.isArray(product.attributes)
          ? (product.attributes as Record<string, unknown>)
          : null,
        {
          enabled: form.premium === "true",
          hero: form.premiumHero,
          images: form.premiumImages,
          featureImages: form.premiumFeatureImages,
          lifestyleImages: form.premiumLifestyleImages,
          benefits: form.premiumBenefits,
          features: form.premiumFeatures,
          specs: form.premiumSpecs,
          faq: form.premiumFaq,
        },
      ),
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
            <Label>Premium product</Label>
            <Select value={form.premium} onValueChange={(value) => set("premium")(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="false">Off — standard product page</SelectItem>
                <SelectItem value="true">On — premium product experience</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Premium only changes presentation on the public product page. It does not change
              price, stock or checkout rules.
            </p>
          </div>

          {form.premium === "true" ? (
            <div className="space-y-3 sm:col-span-2">
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold">Premium page content</h3>
                <p className="text-xs text-muted-foreground">
                  Optional presentation content. Each line is stored as one record; use
                  <span className="font-mono"> | </span>
                  to separate the title from the description. Leave blank to fall back to the
                  standard product page.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Hero image URL</Label>
                <Input
                  value={form.premiumHero}
                  onChange={(e) => set("premiumHero")(e.target.value)}
                  placeholder="https://example.com/hero.webp"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Gallery images (one URL per line)</Label>
                  <textarea
                    value={form.premiumImages}
                    onChange={(e) => set("premiumImages")(e.target.value)}
                    rows={4}
                    className="min-h-[96px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Feature images (one URL per line)</Label>
                  <textarea
                    value={form.premiumFeatureImages}
                    onChange={(e) => set("premiumFeatureImages")(e.target.value)}
                    rows={4}
                    className="min-h-[96px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Lifestyle images (one URL per line)</Label>
                  <textarea
                    value={form.premiumLifestyleImages}
                    onChange={(e) => set("premiumLifestyleImages")(e.target.value)}
                    rows={4}
                    className="min-h-[96px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Benefits</Label>
                  <textarea
                    value={form.premiumBenefits}
                    onChange={(e) => set("premiumBenefits")(e.target.value)}
                    rows={4}
                    placeholder="Padded support|Cushioned back panel"
                    className="min-h-[96px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Features</Label>
                  <textarea
                    value={form.premiumFeatures}
                    onChange={(e) => set("premiumFeatures")(e.target.value)}
                    rows={4}
                    placeholder="Organised compartments|Three safe carry sections"
                    className="min-h-[96px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Specifications</Label>
                  <textarea
                    value={form.premiumSpecs}
                    onChange={(e) => set("premiumSpecs")(e.target.value)}
                    rows={4}
                    placeholder="Material|Oxford fabric"
                    className="min-h-[96px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label>FAQ</Label>
                  <textarea
                    value={form.premiumFaq}
                    onChange={(e) => set("premiumFaq")(e.target.value)}
                    rows={4}
                    placeholder="Is it machine washable?|Hand wash recommended"
                    className="min-h-[96px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label>Selling price</Label>
            <Input
              type="number"
              min="0"
              value={form.price}
              onChange={(e) => set("price")(e.target.value)}
              placeholder="0"
            />
            {priceMissing ? (
              <p className="text-xs font-medium text-destructive">
                Price required before sale. A KES 0 product can be published as a catalogue preview,
                but checkout stays blocked until you enter a positive selling price.
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label>Currency</Label>
            <Input
              maxLength={3}
              value={form.currency}
              onChange={(e) => set("currency")(e.target.value)}
              placeholder="KES"
            />
            <p className="text-xs text-muted-foreground">
              ISO currency code for this product. Falls back to KES when empty.
            </p>
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

          <VariantEditor variants={variants as unknown as Array<Record<string, unknown>>} />

          <div className="space-y-2 sm:col-span-2">
            <Label>External product image URLs</Label>
            <Textarea
              rows={3}
              value={form.images}
              onChange={(e) => set("images")(e.target.value)}
              placeholder="https://supplier.example/product-front.jpg\nhttps://supplier.example/product-detail.jpg"
            />
            <p className="text-xs text-muted-foreground">
              Paste one HTTPS image URL per line. Images stay hosted by the source; AlexOS stores
              only the URLs. Match each URL to this exact product or variant before publishing.
            </p>
            {imageUrls.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {imageUrls.slice(0, 6).map((url) => (
                  <img
                    key={url}
                    src={url}
                    alt="Product preview"
                    width={64}
                    height={64}
                    className="h-16 w-16 rounded-lg border object-cover"
                    loading="lazy"
                  />
                ))}
              </div>
            ) : null}
            {invalidImageUrls.length > 0 ? (
              <p className="text-xs text-destructive">Each image must be a valid HTTPS URL.</p>
            ) : null}
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
                  An active product needs {publicationBlockers.join(", ")}. Keep it as a draft until
                  the source, category and variant availability are verified. Quantity is
                  informational; choose Out of stock when you want to stop accepting orders.
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
