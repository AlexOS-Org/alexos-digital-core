import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, CheckCircle2, Mail, MessageCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DailyGearBrand } from "@/components/dailygear/DailyGearBrand";
import { loadPublicFunnel } from "@/lib/storefront/funnel.functions";
import type {
  PublicFunnel,
  PublicFunnelProduct,
  PublicFunnelStep,
} from "@/lib/storefront/funnel.server";
import { cartStore } from "@/lib/storefront/cart";
import { useStorefront } from "@/lib/storefront/api";
import { trackMetaPixel, useMetaPixel } from "@/lib/storefront/meta-pixel";
import { trackGoogleAnalytics } from "@/lib/storefront/google-analytics";
import { DAILYGEAR_SOCIAL_LINKS, whatsappHref } from "@/lib/storefront/social-links";

interface ConfirmationSnapshot {
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string;
  paymentMethod: string;
  shippingMethod: string;
  shippingCounty: string;
  shippingTown: string;
  shippingAddress: string;
  shippingAddressDetails: string | null;
  items: Array<{ name: string; quantity: number; total: number }>;
  paymentInstructions: { paybill: string; account: string; amount: number } | null;
}

interface ThankYouSearch {
  order?: string;
  funnel?: string;
  value?: number;
  currency?: string;
  contentIds?: string;
}

export const Route = createFileRoute("/shop/thank-you")({
  validateSearch: (search: Record<string, unknown>): ThankYouSearch => ({
    order: typeof search.order === "string" ? search.order : undefined,
    funnel: typeof search.funnel === "string" ? search.funnel : undefined,
    value: typeof search.value === "number" ? search.value : undefined,
    currency: typeof search.currency === "string" ? search.currency : undefined,
    contentIds: typeof search.contentIds === "string" ? search.contentIds : undefined,
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
  const {
    order,
    funnel: funnelSlug,
    value,
    currency,
    contentIds,
  } = Route.useSearch() as ThankYouSearch;
  const { data: store } = useStorefront();
  useMetaPixel(store?.meta_pixel_id);
  const loadFunnel = useServerFn(loadPublicFunnel);
  const [funnel, setFunnel] = useState<PublicFunnel | null>(null);
  const [confirmation, setConfirmation] = useState<ConfirmationSnapshot | null>(null);
  const [offerIndex, setOfferIndex] = useState(0);
  const [loadingOffer, setLoadingOffer] = useState(Boolean(funnelSlug));

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.sessionStorage.getItem("dailygear:last-confirmation");
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        order?: string;
        confirmation?: ConfirmationSnapshot;
        expiresAt?: number;
      };
      if (parsed.order === order && parsed.confirmation && Number(parsed.expiresAt) > Date.now()) {
        setConfirmation(parsed.confirmation);
      }
      window.sessionStorage.removeItem("dailygear:last-confirmation");
    } catch {
      window.sessionStorage.removeItem("dailygear:last-confirmation");
    }
  }, [order]);

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

  const postPurchaseSteps = (funnel?.steps ?? [])
    .filter(
      (step) => (step.stepType === "upsell" || step.stepType === "downsell") && step.productId,
    )
    .sort((a, b) => a.position - b.position);
  const activeOfferStep = postPurchaseSteps[offerIndex] ?? null;
  const activeOfferProduct = activeOfferStep
    ? (funnel?.offerProducts.find((product) => product.id === activeOfferStep.productId) ?? null)
    : null;
  const nearbyDeliveryArea = new Set(["nairobi", "kiambu", "kajiado"]).has(
    confirmation?.shippingCounty?.trim().toLowerCase() ?? "",
  );
  const whatsapp = whatsappHref(store?.whatsapp);
  const supportEmail = store?.support_email?.trim() || null;

  useEffect(() => {
    setOfferIndex(0);
  }, [funnel?.id]);

  useEffect(() => {
    if (
      !order ||
      value == null ||
      !currency ||
      !store?.meta_pixel_id ||
      typeof window === "undefined"
    )
      return;
    const eventKey = `dailygear:purchase-tracked:${order}`;
    if (window.sessionStorage.getItem(eventKey) === "1") return;
    trackMetaPixel("Purchase", {
      content_ids: contentIds ? contentIds.split(",").filter(Boolean) : undefined,
      content_type: "product",
      currency,
      num_items: contentIds ? contentIds.split(",").filter(Boolean).length : undefined,
      value,
    });
    const gaEventKey = `dailygear:ga-purchase-tracked:${order}`;
    if (window.sessionStorage.getItem(gaEventKey) !== "1") {
      trackGoogleAnalytics("purchase", {
        transaction_id: order,
        currency,
        value,
        items: contentIds
          ? contentIds
              .split(",")
              .filter(Boolean)
              .map((itemId) => ({ item_id: itemId }))
          : undefined,
      });
      window.sessionStorage.setItem(gaEventKey, "1");
    }
    window.sessionStorage.setItem(eventKey, "1");
  }, [contentIds, currency, order, store?.meta_pixel_id, value]);

  function acceptOffer(step: PublicFunnelStep, product: PublicFunnelProduct) {
    if (!funnel) return;
    cartStore.add(
      {
        productId: product.id,
        variantId: null,
        name: product.name,
        sku: product.sku,
        price: offerPrice(product),
        image: product.images[0] ?? null,
        maxQuantity: Number.MAX_SAFE_INTEGER,
        offerRole: step.stepType === "upsell" ? "upsell" : "downsell",
        funnelStepId: step.id,
        funnelSlug: funnel.slug,
      },
      1,
    );
    navigate({ to: "/shop/checkout", search: { funnel: funnel.slug } });
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <div className="flex justify-center">
        <DailyGearBrand />
      </div>
      <div className="mt-10 text-center">
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

      {confirmation ? (
        <section className="mt-8 space-y-4 rounded-3xl border bg-card p-5 shadow-sm sm:p-6">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
              Order details
            </p>
            <h2 className="mt-1 text-xl font-black">We have your delivery information</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {confirmation.customerName || "Customer"} · {confirmation.customerPhone}
              {confirmation.customerEmail ? ` · ${confirmation.customerEmail}` : ""}
            </p>
          </div>
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <p>
              <span className="font-semibold">Delivery:</span> {confirmation.shippingMethod},{" "}
              {confirmation.shippingTown}, {confirmation.shippingCounty}
            </p>
            <p>
              <span className="font-semibold">Address:</span> {confirmation.shippingAddress}
              {confirmation.shippingAddressDetails
                ? ` · ${confirmation.shippingAddressDetails}`
                : ""}
            </p>
            <p>
              <span className="font-semibold">Payment:</span> {confirmation.paymentMethod}
            </p>
          </div>
          <div className="space-y-2 border-t pt-4">
            {confirmation.items.map((item, index) => (
              <div
                key={`${item.name}-${index}`}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span>
                  {item.name} × {item.quantity}
                </span>
                {item.total > 0 ? (
                  <span className="font-semibold">KES {item.total.toLocaleString()}</span>
                ) : null}
              </div>
            ))}
          </div>
          {confirmation.paymentInstructions ? (
            <div className="rounded-2xl border border-primary/20 bg-primary/[0.05] p-4 text-sm">
              <div className="flex flex-wrap items-center justify-center gap-2">
                <span className="inline-flex items-center rounded-md bg-[#35a839] px-2.5 py-1 text-xs font-black tracking-wide text-white">
                  M-PESA
                </span>
                <p className="font-bold">Complete M-Pesa payment before dispatch</p>
              </div>
              <p className="mt-1 text-muted-foreground">
                Pay KES {confirmation.paymentInstructions.amount.toLocaleString()} via M-Pesa
                Paybill {confirmation.paymentInstructions.paybill}, account{" "}
                {confirmation.paymentInstructions.account}. Use your order number as an optional
                reference and keep the confirmation message.
              </p>
              <p className="mt-2 text-muted-foreground">
                Online payment helps us prioritise dispatch. An approved online-payment offer may
                save up to <strong className="text-foreground">KES 75</strong> when active; the
                exact amount is valid only when it is reflected in the confirmed order total.
              </p>
            </div>
          ) : confirmation.paymentMethod.toLowerCase().includes("cod") ? (
            <div className="rounded-2xl border border-primary/20 bg-primary/[0.05] p-4 text-sm">
              <p className="font-bold">Cash on delivery</p>
              <p className="mt-1 text-muted-foreground">
                {nearbyDeliveryArea
                  ? "For Nairobi, Kiambu, Kajiado and nearby delivery routes, pay when your order arrives. Keep your phone available so the delivery team can confirm the route."
                  : "Cash on delivery is intended for Nairobi and its environs. For delivery outside that area, contact us first so the team can confirm the route and whether the KES 350 upfront dispatch payment applies."}
              </p>
              {!nearbyDeliveryArea ? (
                <p className="mt-2 text-muted-foreground">
                  Do not send an upfront payment until DailyGear confirms your order. If confirmed,
                  use M-Pesa Paybill <strong className="text-foreground">542542</strong>, account{" "}
                  <strong className="text-foreground">184545</strong>, and send the M-Pesa code with
                  your customer name and order number.
                </p>
              ) : null}
            </div>
          ) : null}
        </section>
      ) : null}

      {confirmation ? (
        <section className="mt-8 rounded-3xl border bg-card p-5 shadow-sm sm:p-6">
          <p className="text-center text-xs font-bold uppercase tracking-[0.16em] text-primary">
            Need help or want to confirm payment?
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Send your order number, customer name, and payment question through an official
            DailyGear channel. Do not share card details or your full payment credentials in a
            public post.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href={whatsapp}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp 0722658824
            </a>
            {supportEmail ? (
              <a
                href={`mailto:${supportEmail}`}
                className="inline-flex items-center rounded-xl border px-4 py-2 text-sm font-semibold"
              >
                <Mail className="mr-2 h-4 w-4" /> Email support
              </a>
            ) : null}
            <a
              href={DAILYGEAR_SOCIAL_LINKS.facebook.href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-xl border px-4 py-2 text-sm font-semibold"
            >
              Facebook
            </a>
          </div>
        </section>
      ) : null}

      {confirmation ? (
        <section className="mt-8 rounded-3xl border bg-muted/20 p-5 sm:p-6">
          <p className="text-center text-xs font-bold uppercase tracking-[0.16em] text-primary">
            You may also like
          </p>
          <h2 className="mt-1 text-center text-xl font-black">Shop more from DailyGear</h2>
          <p className="mt-2 text-center text-sm leading-6 text-muted-foreground">
            Browse the live catalogue for kids' school shoes, ladies' products, boys' products, and
            other available items.
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <Link
              to="/shop/products"
              search={{ q: "school shoes" }}
              className="rounded-xl border bg-card px-3 py-3 text-sm font-semibold hover:border-primary"
            >
              Kids' school shoes
            </Link>
            <Link
              to="/shop/products"
              search={{ q: "ladies" }}
              className="rounded-xl border bg-card px-3 py-3 text-sm font-semibold hover:border-primary"
            >
              Ladies' products
            </Link>
            <Link
              to="/shop/products"
              search={{ q: "boys" }}
              className="rounded-xl border bg-card px-3 py-3 text-sm font-semibold hover:border-primary"
            >
              Boys' products
            </Link>
          </div>
        </section>
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
                {activeOfferStep.stepType === "downsell"
                  ? "A simpler alternative"
                  : "One more useful option"}
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
                  disabled={activeOfferProduct.status === "out_of_stock"}
                >
                  Add to this journey <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  className="rounded-xl"
                  onClick={() => setOfferIndex((current) => current + 1)}
                >
                  No thanks
                </Button>
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
