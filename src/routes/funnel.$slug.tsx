import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, ShieldCheck, ShoppingBag, Truck, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { loadPublicFunnel } from "@/lib/storefront/funnel.functions";
import type {
  PublicFunnel,
  PublicFunnelProduct,
  PublicFunnelVariant,
} from "@/lib/storefront/funnel.server";
import { rememberFunnelAttribution } from "@/lib/storefront/funnel-session";
import { cartStore } from "@/lib/storefront/cart";
import { parseFunnelLandingContent } from "@/lib/storefront/funnel-copy";
import { useStorefront } from "@/lib/storefront/api";
import { initMetaPixel, trackMetaPixel, useMetaPixel } from "@/lib/storefront/meta-pixel";

interface FunnelSearch {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  campaign_id?: string;
  ad_set?: string;
  ad_set_id?: string;
  ad?: string;
  ad_id?: string;
  creative?: string;
  creative_id?: string;
}

export const Route = createFileRoute("/funnel/$slug")({
  validateSearch: (search: Record<string, unknown>): FunnelSearch => ({
    utm_source: typeof search.utm_source === "string" ? search.utm_source : undefined,
    utm_medium: typeof search.utm_medium === "string" ? search.utm_medium : undefined,
    utm_campaign: typeof search.utm_campaign === "string" ? search.utm_campaign : undefined,
    campaign_id: typeof search.campaign_id === "string" ? search.campaign_id : undefined,
    ad_set: typeof search.ad_set === "string" ? search.ad_set : undefined,
    ad_set_id: typeof search.ad_set_id === "string" ? search.ad_set_id : undefined,
    ad: typeof search.ad === "string" ? search.ad : undefined,
    ad_id: typeof search.ad_id === "string" ? search.ad_id : undefined,
    creative: typeof search.creative === "string" ? search.creative : undefined,
    creative_id: typeof search.creative_id === "string" ? search.creative_id : undefined,
  }),
  head: () => ({
    meta: [
      { title: "DailyGear offer" },
      {
        name: "description",
        content: "A focused DailyGear product offer with secure guest checkout.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: FunnelPage,
});

function sellingPrice(product: Pick<PublicFunnelProduct, "price" | "salePrice">) {
  return product.salePrice != null && product.salePrice > 0 && product.salePrice < product.price
    ? product.salePrice
    : product.price;
}

function variantPrice(variant: PublicFunnelVariant, product: PublicFunnelProduct) {
  const base = variant.price ?? product.price;
  return variant.salePrice != null && variant.salePrice > 0 && variant.salePrice < base
    ? variant.salePrice
    : base;
}

function FunnelPage() {
  const navigate = useNavigate();
  const { slug } = Route.useParams();
  const search = Route.useSearch() as FunnelSearch;
  const { data: store } = useStorefront();
  useMetaPixel(store?.meta_pixel_id);
  const load = useServerFn(loadPublicFunnel);
  const [funnel, setFunnel] = useState<PublicFunnel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void load({ data: { slug } })
      .then((result) => {
        if (cancelled) return;
        if (!result) {
          setError("This DailyGear offer is not available.");
          return;
        }
        setFunnel(result);
        initMetaPixel(store?.meta_pixel_id);
        trackMetaPixel("ViewContent", {
          content_ids: [result.product.sku ?? result.product.id],
          content_name: result.product.name,
          content_type: "product",
          currency: result.product.currency,
          value: sellingPrice(result.product),
        });
        const firstVariant = result.variants.find(
          (variant) => variant.productId === result.product.id && variant.stockQuantity > 0,
        );
        setSelectedVariantId(firstVariant?.id ?? null);
        if (typeof window !== "undefined") {
          rememberFunnelAttribution({
            source: search.utm_source ?? result.trafficSource ?? undefined,
            medium: search.utm_medium,
            campaign: search.utm_campaign,
            campaignId: search.campaign_id,
            adSet: search.ad_set,
            adSetId: search.ad_set_id,
            ad: search.ad,
            adId: search.ad_id,
            creative: search.creative,
            creativeId: search.creative_id,
            landingPage: window.location.pathname,
            destinationUrl: window.location.href,
          });
        }
      })
      .catch((reason: unknown) => {
        if (!cancelled)
          setError(reason instanceof Error ? reason.message : "Unable to load this offer.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [load, search, slug, store?.meta_pixel_id]);

  const product = funnel?.product ?? null;

  useEffect(() => {
    if (!product || typeof document === "undefined") return;
    const title = `${product.seoTitle?.trim() || product.name} | DailyGear`;
    const description =
      product.seoDescription?.trim() ||
      product.shortDescription?.trim() ||
      product.description?.trim() ||
      "A focused DailyGear product offer with secure guest checkout.";

    document.title = title;
    const setMeta = (selector: string, attributes: Record<string, string>, content: string) => {
      let element = document.head.querySelector<HTMLMetaElement>(selector);
      if (!element) {
        element = document.createElement("meta");
        Object.entries(attributes).forEach(([key, value]) => element?.setAttribute(key, value));
        document.head.appendChild(element);
      }
      element.setAttribute("content", content);
    };
    setMeta('meta[name="description"]', { name: "description" }, description);
    setMeta('meta[property="og:title"]', { property: "og:title" }, title);
    setMeta('meta[property="og:description"]', { property: "og:description" }, description);
    setMeta('meta[name="twitter:title"]', { name: "twitter:title" }, title);
    setMeta('meta[name="twitter:description"]', { name: "twitter:description" }, description);
  }, [product]);

  const landingCopy = product
    ? parseFunnelLandingContent(
        funnel?.steps.find((step) => step.stepType === "landing")?.body,
        product.name,
      )
    : null;
  const productVariants = useMemo(
    () =>
      funnel?.variants.filter(
        (variant) => variant.productId === product?.id && variant.stockQuantity > 0,
      ) ?? [],
    [funnel?.variants, product?.id],
  );
  const selectedVariant =
    productVariants.find((variant) => variant.id === selectedVariantId) ?? null;
  const price = product
    ? selectedVariant
      ? variantPrice(selectedVariant, product)
      : sellingPrice(product)
    : 0;
  const outOfStock =
    product?.status === "out_of_stock" || selectedVariant?.availabilityConfirmed === false;
  const maxQuantity = Number.MAX_SAFE_INTEGER;
  const orderBump =
    funnel?.steps.find((step) => step.stepType === "order_bump" && step.productId) ?? null;
  const bumpProduct = orderBump
    ? (funnel?.offerProducts.find((offer) => offer.id === orderBump.productId) ?? null)
    : null;
  const heroImage = selectedVariant?.imageUrl ?? product?.images[0] ?? null;

  function addToCheckout() {
    if (!funnel || !product || outOfStock) return;
    cartStore.add(
      {
        productId: product.id,
        variantId: selectedVariant?.id ?? null,
        name: selectedVariant ? `${product.name} — ${selectedVariant.name}` : product.name,
        sku: selectedVariant?.sku ?? product.sku,
        price,
        image: selectedVariant?.imageUrl ?? product.images[0] ?? null,
        maxQuantity,
        offerRole: "primary",
        funnelSlug: funnel.slug,
      },
      quantity,
    );
    trackMetaPixel("AddToCart", {
      content_ids: [selectedVariant?.sku ?? product.sku ?? product.id],
      content_name: product.name,
      content_type: "product",
      contents: [
        {
          id: selectedVariant?.sku ?? product.sku ?? product.id,
          quantity: Math.min(quantity, maxQuantity),
        },
      ],
      currency: product.currency,
      value: price * Math.min(quantity, maxQuantity),
    });
    navigate({ to: "/shop/checkout", search: { funnel: funnel.slug } });
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-20 text-center text-sm text-muted-foreground">
        Loading DailyGear offer…
      </div>
    );
  }
  if (error || !funnel || !product) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-2xl font-black">Offer unavailable</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {error ?? "This offer is not available right now."}
        </p>
        <Button asChild className="mt-6 rounded-xl">
          <Link to="/shop/products">Continue shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <main className="dailygear-funnel-green min-h-screen bg-background">
      <section className="dailygear-workspace-hero relative overflow-hidden border-b border-emerald-400/30 text-white">
        <div className="dailygear-hero-overlay pointer-events-none absolute inset-0" />
        <div className="dailygear-hero-grid pointer-events-none absolute inset-0" />
        <div className="relative z-10 mx-auto grid max-w-6xl gap-8 px-5 py-10 sm:px-8 sm:py-16 lg:grid-cols-[1.02fr_.98fr] lg:items-center lg:gap-14">
          <div>
            <Badge className="rounded-full border-white/20 bg-white/10 px-3 py-1 text-white hover:bg-white/10">
              DailyGear offer
            </Badge>
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-primary">
              {landingCopy?.eyebrow ?? funnel.name}
            </p>
            <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight sm:text-6xl">
              {landingCopy?.headline ?? product.name}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/75 sm:text-lg">
              {landingCopy?.subheadline ??
                product.shortDescription ??
                product.description ??
                "A focused DailyGear offer with clear product information and a fast path to checkout."}
            </p>
            <div className="mt-7 flex flex-wrap gap-2 text-xs text-white/75">
              {(
                landingCopy?.proof ?? [
                  "Secure guest checkout",
                  "Kenya delivery",
                  "Stock checked at order",
                ]
              )
                .slice(0, 3)
                .map((point, index) => (
                  <TrustMini
                    key={`${point}-${index}`}
                    icon={
                      index === 0 ? (
                        <ShieldCheck className="h-4 w-4" />
                      ) : index === 1 ? (
                        <Truck className="h-4 w-4" />
                      ) : (
                        <Zap className="h-4 w-4" />
                      )
                    }
                    text={point}
                  />
                ))}
            </div>
          </div>
          <div className="rounded-[2rem] border border-emerald-300/25 bg-emerald-950/20 p-3 shadow-2xl shadow-emerald-950/25 backdrop-blur-md">
            <div className="aspect-square overflow-hidden rounded-[1.5rem] bg-black/20">
              {heroImage ? (
                <img
                  src={heroImage}
                  alt={selectedVariant ? `${product.name} — ${selectedVariant.name}` : product.name}
                  fetchPriority="high"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="grid h-full place-items-center text-white/60">
                  <ShoppingBag className="h-20 w-20" />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b bg-card/60">
        <div className="mx-auto grid max-w-6xl gap-3 px-5 py-5 sm:grid-cols-3 sm:px-8">
          {[
            ["01", "Choose your option", "Select the colour or SKU that fits you."],
            ["02", "Review at checkout", "Confirm delivery, payment, and your details."],
            ["03", "We follow up", "Track the order and receive delivery updates."],
          ].map(([step, title, body]) => (
            <div
              key={step}
              className="flex gap-3 rounded-2xl border border-emerald-500/20 bg-background/70 p-4"
            >
              <span className="text-xs font-black text-primary">{step}</span>
              <div>
                <p className="text-sm font-bold">{title}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-5 py-10 sm:px-8 lg:grid-cols-[1fr_22rem] lg:py-14">
        <div>
          <div className="grid gap-4 sm:grid-cols-3">
            {(landingCopy?.proof ?? ["Canonical product", "Clear offer", "Existing checkout"])
              .slice(0, 3)
              .map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-emerald-500/20 bg-card p-4 shadow-sm"
                >
                  <Check className="h-4 w-4 text-primary" />
                  <p className="mt-2 text-sm font-semibold">{item}</p>
                </div>
              ))}
          </div>
          <div className="mt-8 rounded-3xl border border-emerald-500/20 bg-card p-5 shadow-sm sm:p-7">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
              Why it fits your day
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">
              {landingCopy?.headline ?? `${product.name}, presented clearly.`}
            </h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              {landingCopy?.subheadline ??
                product.description ??
                product.shortDescription ??
                "Product information will appear here once it is confirmed in the DailyGear catalogue."}
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {(landingCopy?.benefits ?? []).map((benefit) => (
                <div key={benefit.title} className="rounded-2xl border bg-muted/25 p-4">
                  <p className="font-semibold">{benefit.title}</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{benefit.body}</p>
                </div>
              ))}
            </div>
          </div>

          {bumpProduct ? (
            <div className="mt-4 rounded-3xl border border-primary/20 bg-primary/5 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                Optional checkout add-on
              </p>
              <p className="mt-2 text-sm font-semibold">{bumpProduct.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                You can review or decline this offer inside checkout. It will never create a
                separate order.
              </p>
            </div>
          ) : null}
        </div>

        <aside className="h-fit rounded-3xl border border-emerald-500/25 bg-card p-5 shadow-xl shadow-emerald-500/10 lg:sticky lg:top-6 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Your offer
          </p>
          <h2 className="mt-2 text-xl font-black">{product.name}</h2>
          {productVariants.length > 0 ? (
            <div className="mt-5 space-y-2">
              <label htmlFor="funnel-variant" className="text-sm font-semibold">
                Choose an option
              </label>
              <select
                id="funnel-variant"
                value={selectedVariantId ?? ""}
                onChange={(event) => setSelectedVariantId(event.target.value)}
                className="h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              >
                {productVariants.map((variant) => (
                  <option key={variant.id} value={variant.id}>
                    {variant.name} ·{" "}
                    {variant.availabilityConfirmed === false ? "Unavailable" : "Available to order"}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <div className="mt-5 flex items-end justify-between gap-3">
            <span className="text-3xl font-black">
              {product.currency} {price.toLocaleString()}
            </span>
            <span className="text-xs text-muted-foreground">
              {outOfStock ? "Out of stock" : "Available to order"}
            </span>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <label htmlFor="funnel-quantity" className="text-sm font-semibold">
              Quantity
            </label>
            <select
              id="funnel-quantity"
              value={quantity}
              onChange={(event) => setQuantity(Number(event.target.value))}
              className="h-10 rounded-xl border bg-background px-3 text-sm"
              disabled={outOfStock}
            >
              {Array.from({ length: 10 }, (_, index) => (
                <option key={index + 1} value={index + 1}>
                  {index + 1}
                </option>
              ))}
            </select>
          </div>
          <Button
            className="mt-5 w-full rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-emerald-950 dark:hover:bg-emerald-400"
            disabled={outOfStock}
            onClick={addToCheckout}
          >
            {outOfStock ? "Out of stock" : "Order now"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <p className="mt-3 text-center text-xs leading-5 text-muted-foreground">
            {landingCopy?.deliveryNote ??
              "Payment and delivery options are confirmed in DailyGear checkout. No payment is treated as settled until confirmed."}
          </p>
          <Button
            type="button"
            variant="ghost"
            className="mt-2 w-full rounded-xl"
            onClick={() => navigate({ to: "/shop" })}
          >
            <ShoppingBag className="mr-2 h-4 w-4" /> Continue shopping
          </Button>
        </aside>
      </section>

      <div className="fixed inset-x-3 bottom-3 z-30 md:hidden">
        <div className="flex items-center gap-3 rounded-2xl border bg-background/95 p-2 shadow-2xl backdrop-blur">
          <div className="min-w-0 flex-1 px-2">
            <p className="truncate text-xs font-semibold">
              {selectedVariant?.name ?? product.name}
            </p>
            <p className="text-sm font-black">
              {product.currency} {price.toLocaleString()}
            </p>
          </div>
          <Button
            className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-emerald-950 dark:hover:bg-emerald-400"
            disabled={outOfStock}
            onClick={addToCheckout}
          >
            {outOfStock ? "Unavailable" : "Order now"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </main>
  );
}

function TrustMini({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.08] px-3 py-2">
      {icon}
      {text}
    </span>
  );
}
