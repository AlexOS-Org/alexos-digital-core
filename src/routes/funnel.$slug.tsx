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
  }, [load, search, slug]);

  const product = funnel?.product ?? null;
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
  const maxQuantity = selectedVariant?.stockQuantity ?? product?.stockQuantity ?? 0;
  const orderBump =
    funnel?.steps.find((step) => step.stepType === "order_bump" && step.productId) ?? null;
  const bumpProduct = orderBump
    ? (funnel?.offerProducts.find((offer) => offer.id === orderBump.productId) ?? null)
    : null;

  function addToCheckout() {
    if (!funnel || !product || maxQuantity < 1) return;
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
      Math.min(quantity, maxQuantity),
    );
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
    <main className="min-h-screen bg-background">
      <section className="dailygear-workspace-hero relative overflow-hidden border-b text-white">
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
          <div className="rounded-[2rem] border border-white/15 bg-white/[0.08] p-3 shadow-2xl backdrop-blur-md">
            <div className="aspect-square overflow-hidden rounded-[1.5rem] bg-black/20">
              {product.images[0] ? (
                <img
                  src={product.images[0]}
                  alt={product.name}
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

      <section className="mx-auto grid max-w-6xl gap-8 px-5 py-10 sm:px-8 lg:grid-cols-[1fr_22rem] lg:py-14">
        <div>
          <div className="grid gap-4 sm:grid-cols-3">
            {(landingCopy?.proof ?? ["Canonical product", "Clear offer", "Existing checkout"])
              .slice(0, 3)
              .map((item) => (
                <div key={item} className="rounded-2xl border bg-card p-4 shadow-sm">
                  <Check className="h-4 w-4 text-primary" />
                  <p className="mt-2 text-sm font-semibold">{item}</p>
                </div>
              ))}
          </div>
          <div className="mt-8 rounded-3xl border bg-card p-5 shadow-sm sm:p-7">
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

        <aside className="h-fit rounded-3xl border bg-card p-5 shadow-xl shadow-primary/10 lg:sticky lg:top-6 sm:p-6">
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
                    {variant.name} · {variant.stockQuantity} available
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
              {maxQuantity > 0 ? `${maxQuantity} available` : "Out of stock"}
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
              disabled={maxQuantity < 1}
            >
              {Array.from({ length: Math.min(maxQuantity, 10) || 1 }, (_, index) => (
                <option key={index + 1} value={index + 1}>
                  {index + 1}
                </option>
              ))}
            </select>
          </div>
          <Button
            size="lg"
            className="mt-5 w-full rounded-xl"
            disabled={maxQuantity < 1}
            onClick={addToCheckout}
          >
            {maxQuantity < 1 ? "Out of stock" : (landingCopy?.ctaLabel ?? "Continue to checkout")}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <p className="mt-3 text-center text-xs leading-5 text-muted-foreground">
            {landingCopy?.deliveryNote ??
              "Payment and delivery options are confirmed in DailyGear checkout. No payment is treated as settled until confirmed."}
          </p>
        </aside>
      </section>
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
