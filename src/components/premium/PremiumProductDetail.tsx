import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Check, Minus, Plus, ShieldCheck, ShoppingBag, Truck, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ResponsiveProductImage } from "@/components/storefront/ResponsiveProductImage";
import { cartStore } from "@/lib/storefront/cart";
import { trackMetaPixel } from "@/lib/storefront/meta-pixel";
import {
  effectivePrice,
  formatMoney,
  isOnSale,
  productImage,
  type StoreProduct,
  type StoreVariant,
} from "@/lib/storefront/api";
import {
  findVariantForOptions,
  getOptionGroups,
  getVariantOption,
  isVariantUnavailable,
  type VariantOptionValues,
} from "@/lib/storefront/product-options";
import {
  getPremiumConfig,
  getPremiumVisualPlan,
  premiumVariantImage,
} from "@/lib/storefront/premium";

interface Props {
  product: StoreProduct;
  variants: StoreVariant[];
  currency: string;
}

export function PremiumProductDetail({ product, variants, currency }: Props) {
  const config = useMemo(() => getPremiumConfig(product), [product]);
  const plan = useMemo(() => getPremiumVisualPlan(product, variants), [product, variants]);
  const optionGroups = useMemo(() => getOptionGroups(variants), [variants]);

  const [active, setActive] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    variants[0]?.id ?? null,
  );
  const [selectedOptions, setSelectedOptions] = useState<VariantOptionValues>({});
  const [qty, setQty] = useState(1);

  const selectedVariant = variants.find((variant) => variant.id === selectedVariantId) ?? null;
  const sellingItem = selectedVariant ?? product;
  const price = effectivePrice(sellingItem);
  const priceComingSoon = !(Number.isFinite(price) && price > 0);
  const soldOut =
    product.status === "out_of_stock" || selectedVariant?.availability_confirmed === false;
  const canAdd = !soldOut && !priceComingSoon;
  const heroImage =
    plan.hero ?? premiumVariantImage(product, selectedVariant) ?? productImage(product);
  const activeImage = selectedVariant?.image_url ?? plan.gallery[active] ?? heroImage;
  const benefitItems = config.benefits ?? [];
  const featureItems = config.features ?? [];
  const specs = config.specs ?? [];
  const faq = config.faq ?? [];

  function chooseOption(key: "gender" | "color" | "size", value: string) {
    const next = { ...selectedOptions, [key]: value };
    setSelectedOptions(next);
    setSelectedVariantId(findVariantForOptions(variants, next)?.id ?? null);
  }

  function add() {
    if (!canAdd || !product) return;
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
    <div className="store-product-detail mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
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

      {/* Hero */}
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)] lg:gap-12">
        <div className="space-y-3">
          <div className="relative aspect-square overflow-hidden rounded-[2rem] border bg-muted shadow-[0_24px_70px_-40px_var(--alexos-glow)]">
            {activeImage ? (
              <ResponsiveProductImage
                src={activeImage}
                alt={product.image_alt_text ?? product.name}
                width={960}
                height={960}
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                <ShoppingBag className="h-12 w-12" />
              </div>
            )}
            {config.enabled ? (
              <span className="absolute left-4 top-4 rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-primary-foreground">
                Premium
              </span>
            ) : null}
          </div>

          {plan.gallery.length > 1 ? (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {plan.gallery.map((image, index) => (
                <button
                  key={image}
                  type="button"
                  onClick={() => setActive(index)}
                  className={`h-20 w-20 shrink-0 overflow-hidden rounded-xl border ${index === active ? "ring-2 ring-primary" : ""}`}
                  aria-label={`View image ${index + 1}`}
                >
                  <ResponsiveProductImage
                    src={image}
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

        <div className="space-y-6 rounded-[2rem] border border-border/60 bg-card/75 p-5 backdrop-blur-sm sm:p-7">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {isOnSale(sellingItem) ? <Badge className="rounded-full">Sale</Badge> : null}
              <Badge variant={soldOut ? "secondary" : "outline"} className="rounded-full">
                {soldOut ? "Sold out" : availableLabel(priceComingSoon)}
              </Badge>
            </div>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{product.name}</h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {product.short_description ?? product.description}
            </p>
            {priceComingSoon ? (
              <div>
                <p className="text-lg font-bold text-muted-foreground">Price coming soon</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  This product is in catalogue preparation. A positive selling price is required
                  before checkout is enabled.
                </p>
              </div>
            ) : (
              <div className="flex items-baseline gap-3">
                <span className="text-2xl font-bold">{formatMoney(price, currency)}</span>
                {isOnSale(sellingItem) ? (
                  <span className="text-sm text-muted-foreground line-through">
                    {formatMoney(Number(sellingItem.price), currency)}
                  </span>
                ) : null}
              </div>
            )}
          </div>

          {variants.length ? (
            <div className="space-y-4 rounded-2xl border border-border/60 bg-muted/20 p-4">
              <div>
                <p className="text-sm font-semibold">Choose your options</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Colour and size availability is controlled by the store owner.
                </p>
              </div>
              {optionGroups.map(({ key, values }) => (
                <div key={key} className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    {key === "gender" ? "Gender" : key === "color" ? "Colour" : "Size"}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {values.map((value) => {
                      const unavailable = isVariantUnavailable(
                        variants,
                        selectedOptions,
                        key,
                        value,
                      );
                      const selected = selectedOptions[key] === value;
                      const representative =
                        variants.find(
                          (variant) =>
                            getVariantOption(variant, key) === value && variant.image_url,
                        ) ?? variants.find((variant) => getVariantOption(variant, key) === value);
                      return (
                        <button
                          key={value}
                          type="button"
                          disabled={unavailable}
                          onClick={() => chooseOption(key, value)}
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
              ))}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-xl border">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                aria-label="Decrease"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-10 text-center text-sm font-semibold">{qty}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setQty((q) => q + 1)}
                aria-label="Increase"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <Button size="lg" className="flex-1 rounded-xl" disabled={!canAdd} onClick={add}>
              {soldOut ? "Sold out" : priceComingSoon ? "Price coming soon" : "Order now"}
            </Button>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            {[
              { icon: Truck, label: "Fast delivery" },
              { icon: ShieldCheck, label: "Secure checkout" },
              { icon: Undo2, label: "7-day returns" },
            ].map((t) => (
              <div key={t.label} className="flex items-center gap-2 rounded-xl border p-3 text-xs">
                <t.icon className="h-4 w-4 shrink-0 text-primary" />
                {t.label}
              </div>
            ))}
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

      {benefitItems.length ? (
        <section className="mt-14">
          <h2 className="text-xl font-bold tracking-tight">Why it works</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {benefitItems.map((benefit) => (
              <Card key={benefit.title}>
                <CardContent className="space-y-2 p-5">
                  <Check className="h-4 w-4 text-primary" />
                  <p className="font-semibold">{benefit.title}</p>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {benefit.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      {featureItems.length ? (
        <section className="mt-14">
          <h2 className="text-xl font-bold tracking-tight">Features</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {featureItems.map((feature) => (
              <Card key={feature.title}>
                <CardContent className="space-y-2 p-5">
                  <p className="font-semibold">{feature.title}</p>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      {plan.featureImages.length ? (
        <section className="mt-14">
          <h2 className="text-xl font-bold tracking-tight">Product details</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {plan.featureImages.map((image) => (
              <div key={image} className="overflow-hidden rounded-2xl border bg-muted">
                <ResponsiveProductImage
                  src={image}
                  alt={`${product.name} feature`}
                  width={640}
                  height={480}
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className="aspect-[4/3] h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {plan.lifestyleImages.length ? (
        <section className="mt-14">
          <h2 className="text-xl font-bold tracking-tight">In everyday use</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {plan.lifestyleImages.map((image) => (
              <div key={image} className="overflow-hidden rounded-2xl border bg-muted">
                <ResponsiveProductImage
                  src={image}
                  alt={`${product.name} lifestyle`}
                  width={960}
                  height={720}
                  sizes="(max-width: 640px) 100vw, 50vw"
                  className="aspect-[4/3] h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {specs.length || faq.length ? (
        <section className="mt-14 grid gap-6 lg:grid-cols-2">
          {specs.length ? (
            <div className="rounded-2xl border p-5">
              <h2 className="text-xl font-bold tracking-tight">Specifications</h2>
              <dl className="mt-4 space-y-3">
                {specs.map((spec) => (
                  <div key={spec.label} className="flex justify-between gap-4 text-sm">
                    <dt className="text-muted-foreground">{spec.label}</dt>
                    <dd className="text-right font-medium">{spec.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}
          {faq.length ? (
            <Accordion type="single" collapsible className="rounded-2xl border px-5">
              <h2 className="pt-5 text-xl font-bold tracking-tight">FAQ</h2>
              {faq.map((item) => (
                <AccordionItem key={item.question} value={item.question}>
                  <AccordionTrigger className="text-sm">{item.question}</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

function availableLabel(priceComingSoon: boolean) {
  return priceComingSoon ? "Catalogue preview" : "Available to order";
}
