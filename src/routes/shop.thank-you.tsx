import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { loadPublicFunnel } from "@/lib/storefront/funnel.functions";
import type {
  PublicFunnel,
  PublicFunnelProduct,
  PublicFunnelStep,
} from "@/lib/storefront/funnel.server";
import { cartStore } from "@/lib/storefront/cart";

interface ThankYouSearch {
  order?: string;
  funnel?: string;
}

export const Route = createFileRoute("/shop/thank-you")({
  validateSearch: (search: Record<string, unknown>): ThankYouSearch => ({
    order: typeof search.order === "string" ? search.order : undefined,
    funnel: typeof search.funnel === "string" ? search.funnel : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Order confirmed | DailyGear" },
      { name: "description", content: "Your DailyGear order has been received." },
      { property: "og:title", content: "Order confirmed | DailyGear" },
      { property: "og:description", content: "Your DailyGear order has been received." },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ThankYou,
});

function offerPrice(product: PublicFunnelProduct) {
  return product.salePrice != null && product.salePrice > 0 && product.salePrice < product.price
    ? product.salePrice
    : product.price;
}

function ThankYou() {
  const navigate = useNavigate();
  const { order, funnel: funnelSlug } = Route.useSearch() as ThankYouSearch;
  const loadFunnel = useServerFn(loadPublicFunnel);
  const [funnel, setFunnel] = useState<PublicFunnel | null>(null);
  const [upsellDeclined, setUpsellDeclined] = useState(false);
  const [loadingOffer, setLoadingOffer] = useState(Boolean(funnelSlug));

  useEffect(() => {
    if (!funnelSlug) return;
    let cancelled = false;
    void loadFunnel({ data: { slug: funnelSlug } })
      .then((result) => {
        if (!cancelled) setFunnel(result);
      })
      .finally(() => {
        if (!cancelled) setLoadingOffer(false);
      });
    return () => {
      cancelled = true;
    };
  }, [funnelSlug, loadFunnel]);

  const upsellStep =
    funnel?.steps.find((step) => step.stepType === "upsell" && step.productId) ?? null;
  const downsellStep =
    funnel?.steps.find((step) => step.stepType === "downsell" && step.productId) ?? null;
  const activeOfferStep = upsellDeclined ? downsellStep : upsellStep;
  const activeOfferProduct = activeOfferStep
    ? (funnel?.offerProducts.find((product) => product.id === activeOfferStep.productId) ?? null)
    : null;

  function acceptOffer(step: PublicFunnelStep, product: PublicFunnelProduct) {
    cartStore.add(
      {
        productId: product.id,
        variantId: null,
        name: product.name,
        sku: product.sku,
        price: offerPrice(product),
        image: product.images[0] ?? null,
        maxQuantity: product.stockQuantity,
        offerRole: step.stepType === "upsell" ? "upsell" : "downsell",
        funnelStepId: step.id,
      },
      1,
    );
    navigate({ to: "/shop/checkout", search: { funnel: funnel?.slug } });
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:py-20">
      <div className="text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-primary">
          DailyGear order received
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight">
          {funnel?.thankYouHeading ?? "Thank you for your order"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {funnel?.thankYouBody ??
            "We have received your order and will be in touch shortly to confirm delivery."}
        </p>
      </div>

      {order ? (
        <p className="mt-7 rounded-2xl border bg-card p-4 text-center text-sm shadow-sm">
          Your order number is <span className="font-bold">{order}</span>. Keep it safe — you can
          use it to track your delivery.
        </p>
      ) : null}

      {loadingOffer ? (
        <p className="mt-8 text-center text-sm text-muted-foreground">Loading your next option…</p>
      ) : null}
      {!loadingOffer && activeOfferStep && activeOfferProduct ? (
        <section className="mt-8 rounded-3xl border border-primary/20 bg-primary/5 p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                {upsellDeclined ? "A simpler alternative" : "One more useful option"}
              </p>
              <h2 className="mt-1 text-xl font-black">
                {activeOfferStep.title ?? activeOfferProduct.name}
              </h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {activeOfferStep.body ??
                  activeOfferProduct.shortDescription ??
                  `Add ${activeOfferProduct.name} through the same DailyGear checkout.`}
              </p>
              <p className="mt-3 text-2xl font-black">
                {activeOfferProduct.currency} {offerPrice(activeOfferProduct).toLocaleString()}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  className="rounded-xl"
                  onClick={() => acceptOffer(activeOfferStep, activeOfferProduct)}
                  disabled={activeOfferProduct.stockQuantity < 1}
                >
                  Add to this journey <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                {!upsellDeclined ? (
                  <Button
                    variant="ghost"
                    className="rounded-xl"
                    onClick={() => setUpsellDeclined(true)}
                  >
                    No thanks
                  </Button>
                ) : null}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                This is optional. Accepting it opens the existing checkout for an explicit review;
                it never creates a hidden charge.
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild className="rounded-xl">
          <Link to="/shop/track">Track my order</Link>
        </Button>
        <Button asChild variant="outline" className="rounded-xl">
          <Link to="/shop/products">Continue shopping</Link>
        </Button>
      </div>
    </div>
  );
}
