import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Minus, Plus, ShieldCheck, ShoppingBag, Truck, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ProductCard } from "@/components/storefront/ProductCard";
import { ResponsiveProductImage } from "@/components/storefront/ResponsiveProductImage";
import { cartStore, useRecentlyViewed } from "@/lib/storefront/cart";
import { trackMetaPixel } from "@/lib/storefront/meta-pixel";
import {
  effectivePrice,
  formatMoney,
  isOnSale,
  productImage,
  useStoreProduct,
  useStoreProducts,
  useStoreVariants,
  useStorefront,
} from "@/lib/storefront/api";

export const Route = createFileRoute("/shop/product/$id")({
  head: () => ({
    meta: [
      { title: "Product details | DailyGear" },
      { name: "description", content: "Product details, pricing and delivery information." },
      { property: "og:title", content: "Product details | DailyGear" },
      { property: "og:description", content: "Product details, pricing and delivery information." },
      { property: "og:type", content: "product" },
    ],
  }),
  component: ProductDetail,
});

type VariantOptionKey = "color" | "size";

type VariantOptionValues = Partial<Record<VariantOptionKey, string>>;

function getVariantOption(
  variant: NonNullable<ReturnType<typeof useStoreVariants>["data"]>[number],
  key: VariantOptionKey,
) {
  if (key === "color" && variant.color?.trim()) return variant.color.trim();
  const options = variant.options;
  if (options && typeof options === "object" && !Array.isArray(options)) {
    const value =
      (options as Record<string, unknown>)[key] ??
      (key === "color" ? (options as Record<string, unknown>).colour : undefined);
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function ProductDetail() {
  const { id } = Route.useParams();
  const { data: store } = useStorefront();
  const { data: product, isLoading } = useStoreProduct(id);
  const { data: variants = [] } = useStoreVariants(product?.id);
  const related = useStoreProducts(store?.user_id, { limit: 4 });
  const { track } = useRecentlyViewed();
  const [qty, setQty] = useState(1);
  const [active, setActive] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<VariantOptionValues>({});
  const currency = store?.currency ?? "KES";

  const optionGroups = useMemo(() => {
    return (["color", "size"] as const).flatMap((key) => {
      const values = Array.from(
        new Set(
          variants
            .map((variant) => getVariantOption(variant, key))
            .filter((value): value is string => Boolean(value)),
        ),
      );
      return values.length ? [{ key, values }] : [];
    });
  }, [variants]);

  useEffect(() => {
    if (!product) return;
    track(product.id);
    trackMetaPixel("ViewContent", {
      content_ids: [product.sku ?? product.id],
      content_name: product.name,
      content_type: "product",
      currency,
      value: effectivePrice(product),
    });
  }, [currency, product, track]);

  useEffect(() => {
    if (!product) return;
    const firstVariant = variants[0];
    setSelectedVariantId(firstVariant?.id ?? null);
    setSelectedOptions(
      firstVariant
        ? {
            color: getVariantOption(firstVariant, "color") ?? undefined,
            size: getVariantOption(firstVariant, "size") ?? undefined,
          }
        : {},
    );
    setQty(1);
    setActive(0);
    document.title = `${product.seo_title ?? product.name} | DailyGear`;
    const description = product.seo_description ?? product.short_description ?? product.description;
    if (description) {
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("name", "description");
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", description);
    }
  }, [product, variants]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10">
        <Skeleton className="h-[28rem] rounded-3xl" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-2xl font-black">Product not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          It may have been removed or is no longer available.
        </p>
        <Button asChild className="mt-6 rounded-xl">
          <Link to="/shop/products">Back to shop</Link>
        </Button>
      </div>
    );
  }

  const images = ((product.images ?? []) as string[]).filter(Boolean);
  const selectedVariant = variants.find((variant) => variant.id === selectedVariantId) ?? null;
  const sellingItem = selectedVariant ?? product;
  const price = effectivePrice(sellingItem);
  const soldOut =
    product.status === "out_of_stock" || selectedVariant?.availability_confirmed === false;

  function add() {
    if (!product) return;
    cartStore.add(
      {
        productId: product.id,
        variantId: selectedVariant?.id ?? null,
        name: selectedVariant ? `${product.name} — ${selectedVariant.name}` : product.name,
        sku: selectedVariant?.sku ?? product.sku,
        price,
        image: selectedVariant?.image_url ?? productImage(product),
        maxQuantity: Number.MAX_SAFE_INTEGER,
      },
      qty,
    );
    trackMetaPixel("AddToCart", {
      content_ids: [selectedVariant?.sku ?? product.sku ?? product.id],
      content_name: product.name,
      content_type: "product",
      contents: [{ id: selectedVariant?.sku ?? product.sku ?? product.id, quantity: qty }],
      currency,
      value: price * qty,
    });
    toast.success(`${product.name} added to bag`);
  }

  return (
    <div className="store-product-detail mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
      <nav className="mb-6 flex flex-wrap items-center text-xs text-muted-foreground">
        <Link to="/shop" className="hover:text-foreground">
          Home
        </Link>
        <span className="px-2">/</span>
        <Link to="/shop/products" className="hover:text-foreground">
          Shop
        </Link>
        <span className="px-2">/</span>
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.06fr)_minmax(360px,0.94fr)] lg:gap-12">
        <div className="store-product-gallery space-y-3">
          <div className="aspect-square overflow-hidden rounded-[2rem] border bg-muted shadow-[0_24px_70px_-40px_var(--alexos-glow)]">
            {images[active] ? (
              <ResponsiveProductImage
                src={images[active]}
                alt={product.image_alt_text ?? product.name}
                width={800}
                height={800}
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                <ShoppingBag className="h-12 w-12" />
              </div>
            )}
          </div>
          {images.length > 1 ? (
            <div className="flex gap-2 overflow-x-auto">
              {images.map((img, i) => (
                <button
                  key={img}
                  onClick={() => setActive(i)}
                  className={`h-20 w-20 shrink-0 overflow-hidden rounded-xl border ${i === active ? "ring-2 ring-primary" : ""}`}
                  aria-label={`View image ${i + 1}`}
                >
                  <ResponsiveProductImage
                    src={img}
                    alt=""
                    width={160}
                    height={160}
                    sizes="80px"
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="store-product-purchase space-y-6 rounded-[2rem] border border-border/60 bg-card/75 p-5 shadow-[0_20px_55px_-40px_var(--alexos-glow)] backdrop-blur-sm sm:p-7">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {isOnSale(sellingItem) ? <Badge className="rounded-full">Sale</Badge> : null}
              <Badge variant={soldOut ? "secondary" : "outline"} className="rounded-full">
                {soldOut ? "Sold out" : "Available to order"}
              </Badge>
            </div>
            <h1 className="text-3xl font-black tracking-tight">{product.name}</h1>
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-bold">{formatMoney(price, currency)}</span>
              {isOnSale(sellingItem) ? (
                <span className="text-sm text-muted-foreground line-through">
                  {formatMoney(Number(sellingItem.price), currency)}
                </span>
              ) : null}
            </div>
            {variants.length ? (
              <div className="space-y-4 rounded-2xl border border-border/60 bg-muted/20 p-4">
                <div>
                  <p className="text-sm font-semibold">Choose your options</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Select a live colour and size combination. Availability is controlled by the
                    store owner.
                  </p>
                </div>
                {optionGroups.length ? (
                  optionGroups.map(({ key, values }) => (
                    <div key={key} className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        {key === "color" ? "Colour" : "Size"}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {values.map((value) => {
                          const candidateVariants = variants.filter((variant) => {
                            if (getVariantOption(variant, key) !== value) return false;
                            return optionGroups.every(
                              ({ key: otherKey }) =>
                                otherKey === key ||
                                !selectedOptions[otherKey] ||
                                getVariantOption(variant, otherKey) === selectedOptions[otherKey],
                            );
                          });
                          const unavailable =
                            candidateVariants.length > 0 &&
                            candidateVariants.every(
                              (variant) => variant.availability_confirmed === false,
                            );
                          const selected = selectedOptions[key] === value;
                          return (
                            <button
                              key={value}
                              type="button"
                              disabled={unavailable}
                              onClick={() => {
                                const nextOptions = { ...selectedOptions, [key]: value };
                                const nextVariant =
                                  variants.find((variant) =>
                                    optionGroups.every(
                                      ({ key: groupKey }) =>
                                        !nextOptions[groupKey] ||
                                        getVariantOption(variant, groupKey) ===
                                          nextOptions[groupKey],
                                    ),
                                  ) ?? candidateVariants[0];
                                setSelectedOptions(nextOptions);
                                setSelectedVariantId(nextVariant?.id ?? null);
                              }}
                              className={`min-h-11 rounded-xl border px-3.5 py-2 text-left text-sm transition ${
                                selected
                                  ? "border-primary bg-primary/10 text-primary shadow-sm"
                                  : "border-border/70 bg-background/70 hover:border-primary/50 hover:bg-primary/5"
                              } ${unavailable ? "cursor-not-allowed opacity-45" : ""}`}
                              aria-pressed={selected}
                            >
                              <span className="font-medium">{value}</span>
                              <span className="ml-2 text-[11px] text-muted-foreground">
                                {unavailable ? "Unavailable" : "Available"}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {variants.map((variant) => {
                      const variantSoldOut = variant.availability_confirmed === false;
                      const selected = variant.id === selectedVariantId;
                      return (
                        <button
                          key={variant.id}
                          type="button"
                          disabled={variantSoldOut}
                          onClick={() => setSelectedVariantId(variant.id)}
                          className={`min-h-11 rounded-xl border px-3.5 py-2 text-left text-sm transition ${
                            selected
                              ? "border-primary bg-primary/10 text-primary"
                              : "hover:bg-muted"
                          } ${variantSoldOut ? "cursor-not-allowed opacity-50" : ""}`}
                        >
                          <span className="font-medium">{variant.name}</span>
                          <span className="ml-2 text-xs text-muted-foreground">
                            {variantSoldOut ? "Unavailable" : "Available"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : null}
            {(product.short_description ?? product.description) ? (
              <p className="text-sm leading-relaxed text-muted-foreground">
                {product.short_description ?? product.description}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-xl border">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                aria-label="Decrease"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-10 text-center text-sm font-semibold">{qty}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setQty((q) => q + 1)}
                aria-label="Increase"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <Button size="lg" className="flex-1 rounded-xl" disabled={soldOut} onClick={add}>
              {soldOut ? "Sold out" : "Order now"}
            </Button>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            {[
              { icon: Truck, label: "Fast delivery" },
              { icon: ShieldCheck, label: "Secure checkout" },
              { icon: Undo2, label: "7-day returns" },
            ].map((t) => (
              <div
                key={t.label}
                className="store-product-trust flex items-center gap-2 rounded-xl border p-3 text-xs"
              >
                <t.icon className="h-4 w-4 shrink-0 text-primary" />
                {t.label}
              </div>
            ))}
          </div>

          <div className="rounded-2xl border bg-muted/40 p-4">
            <p className="text-sm font-semibold">Before you add to bag</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Check the selected option and current availability. Delivery, returns and support
              details are available before you place an order.
            </p>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-primary">
              <Link
                to="/shop/policies/$slug"
                params={{ slug: "shipping" }}
                className="hover:underline"
              >
                Shipping policy
              </Link>
              <Link
                to="/shop/policies/$slug"
                params={{ slug: "returns" }}
                className="hover:underline"
              >
                Returns policy
              </Link>
              <Link to="/shop/contact" className="hover:underline">
                Need help?
              </Link>
            </div>
          </div>

          <Accordion type="single" collapsible className="rounded-2xl border px-4">
            <AccordionItem value="delivery">
              <AccordionTrigger className="text-sm">Delivery & returns</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                Orders are dispatched within 24 hours. Returns accepted within 7 days of delivery in
                original condition.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="details">
              <AccordionTrigger className="text-sm">Product details</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                {product.sku ? `SKU ${product.sku}. ` : ""}
                {product.description ?? "Full specifications available on request."}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      {related.data?.length ? (
        <section className="mt-16 space-y-4">
          <h2 className="text-xl font-bold tracking-tight">You may also like</h2>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {related.data
              .filter((p) => p.id !== product.id)
              .slice(0, 4)
              .map((p) => (
                <ProductCard key={p.id} product={p} currency={currency} />
              ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
