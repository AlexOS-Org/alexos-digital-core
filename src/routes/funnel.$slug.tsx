import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ArrowRight, Check, ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DailyGearBrand } from "@/components/dailygear/DailyGearBrand";
import { loadPublicFunnel } from "@/lib/storefront/funnel.functions";
import type {
  PublicFunnel,
  PublicFunnelProduct,
  PublicFunnelVariant,
} from "@/lib/storefront/funnel.server";
import { rememberFunnelAttribution } from "@/lib/storefront/funnel-session";
import { cartStore } from "@/lib/storefront/cart";
import { readCheckoutProfile, saveCheckoutProfile } from "@/lib/storefront/checkout-profile";
import { parseFunnelLandingContent } from "@/lib/storefront/funnel-copy";
import { useStorefront } from "@/lib/storefront/api";
import { initMetaPixel, trackMetaPixel, useMetaPixel } from "@/lib/storefront/meta-pixel";
import { trackGoogleAnalytics } from "@/lib/storefront/google-analytics";
import {
  YJ_COLOUR_CARDS,
  YJ_EXACT_COLOUR_IMAGES,
  yjColourImage,
} from "@/lib/storefront/yj-colours";

const YJ_HERO_IMAGE = "/assets/yj-baby-three-colour-card.png";
const YJ_BENEFIT_IMAGES = [
  "/assets/yj-feature-card-01-repaired-with-wording.png",
  "/assets/yj-feature-card-02-repaired-with-wording.png",
  "/assets/yj-baby-waterproof-card.png",
  "/assets/yj-baby-three-colour-card.png",
] as const;
const YJ_DETAIL_IMAGES = [
  ["/assets/yj-baby-waterproof-fabric-detail.png", "Water droplets on YJ Baby Oxford fabric"],
  ["/assets/yj-baby-zipper-detail.png", "Close-up of YJ Baby backpack zipper pulls"],
  ["/assets/yj-baby-adjustable-straps-detail.png", "Close-up of YJ Baby adjustable shoulder strap"],
  ["/assets/yj-baby-cushioned-back-detail.png", "YJ Baby backpack cushioned back panel"],
  ["/assets/yj-baby-reinforced-bottom-detail.png", "YJ Baby backpack reinforced protective bottom"],
] as const;

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
  const [variantQuantities, setVariantQuantities] = useState<Record<string, number>>({});
  const [profileLoaded, setProfileLoaded] = useState(false);
  const viewContentTrackedRef = useRef<string | null>(null);
  const orderFormRef = useRef<HTMLFormElement>(null);
  const [customer, setCustomer] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    address: "",
    county: "",
    town: "",
    deliveryDetails: "",
  });

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
        const availableVariants = result.variants.filter(
          (variant) => variant.productId === result.product.id && variant.stockQuantity > 0,
        );
        const firstVariant =
          availableVariants.find((variant) => variant.name.toLowerCase().includes("green")) ??
          availableVariants[0];
        setSelectedVariantId(firstVariant?.id ?? null);
        setVariantQuantities(firstVariant ? { [firstVariant.id]: 1 } : {});
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
  const isYjBag = slug === "quality-waterproof-yj-children-school-bag-funnel";

  useEffect(() => {
    const pixelId = store?.meta_pixel_id;
    if (!funnel || !pixelId || viewContentTrackedRef.current === funnel.slug) return;
    initMetaPixel(pixelId);
    trackMetaPixel("ViewContent", {
      content_ids: [funnel.product.sku ?? funnel.product.id],
      content_name: funnel.product.name,
      content_type: "product",
      currency: funnel.product.currency,
      value: sellingPrice(funnel.product),
    });
    viewContentTrackedRef.current = funnel.slug;
  }, [funnel, store?.meta_pixel_id]);

  useEffect(() => {
    const profile = readCheckoutProfile();
    if (!profile) return;
    setCustomer({
      firstName: profile.firstName,
      lastName: profile.lastName,
      phone: profile.phone,
      email: profile.email,
      address: profile.address,
      county: profile.county,
      town: profile.town,
      deliveryDetails: profile.deliveryDetails,
    });
    setProfileLoaded(true);
  }, []);

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
  const effectiveLandingCopy = isYjBag
    ? {
        eyebrow: "A calmer start to every school day",
        headline: "Stop the morning scramble. Give every school essential a reliable place.",
        subheadline:
          "No more searching for a missing exercise book while the school morning is already moving. The YJ Baby Oxford School Backpack helps keep books, stationery, water bottles and personal items organised in one dependable bag—so your child can leave ready for the day.",
        proof: [
          "Waterproof Oxford fabric helps protect supplies from rain and spills",
          "Multiple zipped compartments plus two side pockets for organised storage",
          "Padded straps and a cushioned back panel for a more comfortable daily carry",
        ],
        benefits: [
          {
            title: "Turn rushed mornings into organised starts",
            body: "The spacious interior, front pocket, two side pockets, interior zipped pocket and organiser pockets give books, stationery, water bottles and personal items a clear place.",
          },
          {
            title: "Make the school-day carry feel more manageable",
            body: "Ergonomic padded shoulder straps, a cushioned back panel and a sturdy top handle support the everyday routine from home to class and back again.",
          },
          {
            title: "Protect the things your child needs",
            body: "High-quality waterproof Oxford fabric helps protect school supplies and electronic gadgets from unexpected rain, dampness and spills.",
          },
          {
            title: "Choose a bag they will be happy to carry",
            body: "Select an available colour for school days, outdoor trips and excursions—a practical backpack designed for primary and secondary students.",
          },
        ],
        deliveryNote:
          "Choose the colour and quantity your child needs, enter the delivery details, and review the available payment and delivery options at checkout.",
      }
    : landingCopy;
  const productVariants = useMemo(
    () =>
      funnel?.variants.filter(
        (variant) => variant.productId === product?.id && variant.stockQuantity > 0,
      ) ?? [],
    [funnel?.variants, product?.id],
  );
  const availableColourNames = productVariants.map((variant) =>
    variant.name.replace(/^YJ Baby\s*[–-]\s*/i, "").trim(),
  );
  const availableColoursLabel = availableColourNames.length
    ? availableColourNames.length === 1
      ? availableColourNames[0]
      : `${availableColourNames.slice(0, -1).join(", ")} & ${availableColourNames.at(-1)}`
    : "available options";
  const visibleProof = (
    effectiveLandingCopy?.proof ?? ["Canonical product", "Clear offer", "Existing checkout"]
  ).map((item) => item.replace(/Blue, Pink, Red & Green/gi, availableColoursLabel));
  const visibleBenefits = (effectiveLandingCopy?.benefits ?? []).map((benefit) => ({
    ...benefit,
    body: benefit.body.replace(
      /currently available Blue, Pink, Red and Green options/gi,
      `currently available ${availableColoursLabel} options`,
    ),
  }));
  const selectedVariant =
    productVariants.find((variant) => variant.id === selectedVariantId) ?? null;
  const selectedQuantity = selectedVariant ? (variantQuantities[selectedVariant.id] ?? 0) : 0;
  const hasSelection = Object.values(variantQuantities).some((value) => value > 0);
  const selectedTotal = product
    ? productVariants.reduce(
        (total, variant) =>
          total + variantPrice(variant, product) * (variantQuantities[variant.id] ?? 0),
        0,
      )
    : 0;
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
  const heroImage = isYjBag
    ? YJ_HERO_IMAGE
    : (selectedVariant?.imageUrl ?? product?.images[0] ?? null);
  const galleryImages = useMemo(() => {
    const candidates = [
      ...productVariants.map((variant) => variant.imageUrl),
      ...(product?.images ?? []),
      ...(isYjBag ? [...YJ_EXACT_COLOUR_IMAGES, YJ_HERO_IMAGE] : []),
    ].filter((image): image is string => Boolean(image));
    return Array.from(new Set(candidates));
  }, [isYjBag, product?.images, productVariants]);

  function focusOrderForm() {
    trackGoogleAnalytics("select_promotion", {
      promotion_id: funnel?.slug,
      promotion_name: "YJ Baby Order Now CTA",
      creative_name: "first-page-cta",
    });
    orderFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(
      () => orderFormRef.current?.querySelector<HTMLInputElement>("input")?.focus(),
      350,
    );
  }

  function addToCheckout() {
    if (!funnel || !product || !hasSelection) return;
    const selectedContents: Array<{ id: string; quantity: number }> = [];
    productVariants.forEach((variant) => {
      const selectedQuantity = variantQuantities[variant.id] ?? 0;
      if (selectedQuantity <= 0) return;
      cartStore.add(
        {
          productId: product.id,
          variantId: variant.id,
          name: `${product.name} — ${variant.name}`,
          sku: variant.sku ?? product.sku,
          price: variantPrice(variant, product),
          image: isYjBag ? yjColourImage(variant) : (variant.imageUrl ?? product.images[0] ?? null),
          maxQuantity,
          offerRole: "primary",
          funnelSlug: funnel.slug,
        },
        selectedQuantity,
      );
      selectedContents.push({
        id: variant.sku ?? product.sku ?? product.id,
        quantity: Math.min(selectedQuantity, maxQuantity),
      });
    });
    trackMetaPixel("AddToCart", {
      content_ids: selectedContents.map((content) => content.id),
      content_name: product.name,
      content_type: "product",
      contents: selectedContents,
      currency: product.currency,
      value: selectedTotal,
    });
    trackGoogleAnalytics("begin_checkout", {
      currency: product.currency,
      value: selectedTotal,
      items: selectedContents.map((content) => ({
        item_id: content.id,
        quantity: content.quantity,
      })),
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
  function handleFirstPageCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      !hasSelection ||
      !customer.firstName.trim() ||
      !customer.phone.trim() ||
      !customer.address.trim() ||
      !customer.county.trim() ||
      !customer.town.trim()
    ) {
      return;
    }
    saveCheckoutProfile(customer);
    addToCheckout();
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
    <main className="min-h-screen bg-background text-foreground">
      <section className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-5xl flex-col items-center px-5 pb-10 pt-8 text-center sm:px-8 sm:pb-14 sm:pt-12">
          <DailyGearBrand />
          <div className="mt-8 h-px w-full max-w-3xl bg-border" />
          <Badge className="mt-8 rounded-full border-border bg-muted text-muted-foreground hover:bg-muted">
            DailyGear offer
          </Badge>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-primary">
            {effectiveLandingCopy?.eyebrow ?? funnel.name}
          </p>
          <h1 className="mt-3 max-w-4xl text-3xl font-black tracking-tight sm:text-5xl">
            {effectiveLandingCopy?.headline ?? product.name}
          </h1>
          {isYjBag ? (
            <>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
                Choose an available colour, tell us where to deliver, and use the same secure
                checkout flow to complete your order.
              </p>
              <Button
                type="button"
                onClick={focusOrderForm}
                className="mt-5 rounded-xl bg-foreground px-6 text-background hover:bg-foreground/90"
                aria-controls="yj-order-form"
              >
                Order Now <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </>
          ) : null}
          {isYjBag ? (
            <div className="mt-8 w-full max-w-5xl overflow-hidden rounded-3xl border border-border bg-card p-2 shadow-sm sm:p-3">
              <img
                src="/assets/yj-baby-hero-classroom.webp"
                alt="YJ Baby school bags in navy blue with pink trim, red, and teal-green"
                width={2560}
                height={1440}
                fetchPriority="high"
                decoding="async"
                className="aspect-video w-full rounded-2xl object-cover"
              />
            </div>
          ) : null}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-5 py-10 sm:px-8 lg:grid-cols-[1fr_22rem] lg:py-14">
        <div>
          <div className="grid gap-4">
            {visibleProof.slice(0, 3).map((item) => (
              <div key={item} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <Check className="h-4 w-4 text-primary" />
                <p className="mt-2 text-sm font-semibold">{item}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-7">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
              Why it fits your day
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">
              {effectiveLandingCopy?.headline ?? `${product.name}, presented clearly.`}
            </h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              {effectiveLandingCopy?.subheadline ??
                product.description ??
                product.shortDescription ??
                "Product information will appear here once it is confirmed in the DailyGear catalogue."}
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {visibleBenefits.map((benefit, index) => {
                const benefitSummaryImages = isYjBag
                  ? [
                      "/assets/yj-feature-card-01-clean.webp",
                      "/assets/yj-feature-card-02-clean.webp",
                      "/assets/yj-feature-card-03-clean.webp",
                      "/assets/yj-feature-card-04-clean.webp",
                    ]
                  : galleryImages;
                const image =
                  benefitSummaryImages[index % Math.max(benefitSummaryImages.length, 1)];
                return (
                  <article
                    key={benefit.title}
                    className="overflow-hidden rounded-2xl border border-border bg-muted/25"
                  >
                    {image ? (
                      <img
                        src={image}
                        alt={`${product.name} — ${benefit.title}`}
                        width={800}
                        height={600}
                        loading="lazy"
                        decoding="async"
                        className="aspect-[4/3] w-full object-contain"
                      />
                    ) : null}
                    <div className="p-4">
                      <p className="font-semibold">{benefit.title}</p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{benefit.body}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          <section className="mt-8 space-y-6" aria-label="Product benefits and images">
            {visibleBenefits.map((benefit, index) => {
              const benefitImageUrls = isYjBag ? YJ_BENEFIT_IMAGES : galleryImages;
              const image = benefitImageUrls[index % Math.max(benefitImageUrls.length, 1)];
              return (
                <article
                  key={`visual-${benefit.title}`}
                  className="grid items-center gap-5 rounded-3xl border border-border bg-card p-4 shadow-sm sm:grid-cols-2 sm:p-6"
                >
                  <div className={index % 2 === 1 ? "sm:order-2" : ""}>
                    {image ? (
                      <img
                        src={image}
                        alt={`${product.name} — ${benefit.title}`}
                        width={800}
                        height={600}
                        loading="lazy"
                        decoding="async"
                        className="aspect-[4/3] w-full rounded-2xl bg-muted/20 object-contain"
                      />
                    ) : (
                      <div className="grid aspect-[4/3] place-items-center rounded-2xl bg-muted/40 text-muted-foreground">
                        <ShoppingBag className="h-12 w-12" />
                      </div>
                    )}
                  </div>
                  <div className={index % 2 === 1 ? "sm:order-1" : ""}>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                      0{index + 1} · Why it fits
                    </p>
                    <h3 className="mt-2 text-2xl font-black tracking-tight">{benefit.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">{benefit.body}</p>
                  </div>
                </article>
              );
            })}
          </section>

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

          {isYjBag ? (
            <section
              className="mt-8 rounded-3xl border border-primary/30 bg-card p-5 text-center shadow-sm sm:p-8"
              aria-label="YJ offer details"
            >
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                YJ Baby premium school bag
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight">
                Stop the morning scramble. Give your child’s school essentials one reliable place.
              </h2>
              <img
                src="/assets/yj-baby-offer-colours.webp"
                alt="YJ Baby school bags in red, teal-green, and navy blue with pink trim"
                width={1400}
                height={1050}
                loading="lazy"
                decoding="async"
                className="mx-auto mt-6 aspect-[4/3] w-full max-w-2xl rounded-2xl object-contain"
              />
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
                Give books, stationery and everyday essentials a dependable home. Choose the
                available colour and quantity, then continue to checkout.{" "}
                <strong className="text-foreground">KES 2,750 per bag</strong>.
              </p>
              <div className="mt-6 grid gap-3 text-left sm:grid-cols-3">
                {[
                  [
                    "Less searching, more getting ready",
                    "Multiple zipped compartments and two side pockets help separate books, stationery, water bottles and personal items.",
                  ],
                  [
                    "Comfort-focused everyday design",
                    "Ergonomic padded shoulder straps, a cushioned back panel and a sturdy top handle support daily carrying.",
                  ],
                  [
                    "Ready for school days and trips",
                    "Waterproof Oxford fabric, organised storage and side pockets suit school routines, outdoor trips and excursions.",
                  ],
                ].map(([title, body]) => (
                  <div key={title} className="rounded-2xl border border-border bg-background p-4">
                    <p className="font-semibold">{title}</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{body}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 grid gap-3 border-t border-border pt-5 text-left sm:grid-cols-3">
                {[
                  ["Colour choice", "Select only the colour and quantity currently available."],
                  [
                    "Delivery clarity",
                    "Review county, town, payment method, and delivery details before ordering.",
                  ],
                  [
                    "Honest feedback",
                    "Verified customer feedback will be added after delivered orders are reviewed.",
                  ],
                ].map(([title, body]) => (
                  <div key={title} className="flex gap-3 rounded-2xl bg-primary/5 p-4">
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                    <div>
                      <p className="font-semibold">{title}</p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {isYjBag ? (
            <section
              className="mt-8 grid items-center gap-6 rounded-3xl border border-border bg-card p-5 shadow-sm sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] sm:p-7"
              aria-label="YJ quality and trust"
            >
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {YJ_DETAIL_IMAGES.map(([image, alt]) => (
                  <img
                    key={image}
                    src={image}
                    alt={alt}
                    width={900}
                    height={675}
                    loading="lazy"
                    decoding="async"
                    className="aspect-[4/3] w-full rounded-2xl object-contain"
                  />
                ))}
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                  Confidence before you order
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight">
                  A school bag you can understand before it arrives.
                </h2>
                <p className="mt-4 text-sm leading-7 text-muted-foreground">
                  Choosing a school bag is about more than appearance. Review the material, storage,
                  carrying design, available colour, and ordering details before you decide.
                </p>
                <div className="mt-4 grid gap-3 text-sm leading-6 text-muted-foreground">
                  <p>
                    <strong className="text-foreground">Clear product details:</strong> waterproof
                    Oxford fabric, multiple zipped compartments, two side pockets, padded straps, a
                    cushioned back panel, a sturdy top handle, and reinforced stitching.
                  </p>
                  <p>
                    <strong className="text-foreground">Built around everyday use:</strong>{" "}
                    organised space for books, stationery, water bottles, personal items, and
                    electronic gadgets.
                  </p>
                  <p>
                    <strong className="text-foreground">Straightforward ordering:</strong> select an
                    available colour and quantity, enter delivery details, and review payment and
                    delivery options before continuing.
                  </p>
                </div>
              </div>
            </section>
          ) : null}

          {isYjBag ? (
            <section
              className="mt-8 rounded-3xl border border-border bg-muted/20 p-5 sm:p-7"
              aria-label="YJ delivery and ordering information"
            >
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                Before you order
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight">
                Choose the colour they will love, add the quantity you need, and tell us where to
                deliver.
              </h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                Delivery and payment options are confirmed during checkout based on your location
                and selected method. Review the colour, quantity, county, town and delivery details
                before continuing.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-border bg-card p-4">
                  <p className="font-semibold">Will it hold the essentials?</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    The spacious interior, zipped compartments, organiser pockets, and side pockets
                    help give books, stationery, bottles, and personal items a clear place.
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-card p-4">
                  <p className="font-semibold">What if the weather changes?</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Waterproof Oxford fabric helps protect school supplies from unexpected rain,
                    dampness, and spills.
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-card p-4">
                  <p className="font-semibold">What happens after I order?</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Review your delivery details and payment method at checkout. Payment is not
                    treated as settled until confirmed by DailyGear.
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-card p-4">
                  <p className="font-semibold">What if I need support?</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Contact DailyGear through the support channel shown on the store if you have a
                    question about the product or delivery.
                  </p>
                </div>
              </div>
              <p className="mt-5 text-sm leading-7 text-muted-foreground">
                Your order is not treated as paid until payment is confirmed by DailyGear. No
                reminder-email option is shown on this funnel.
              </p>
            </section>
          ) : null}
        </div>

        <aside className="h-fit rounded-3xl border border-border bg-card p-5 shadow-xl lg:sticky lg:top-6 sm:p-6">
          {galleryImages.length > 0 ? (
            <section
              className="-m-1 mb-5 rounded-3xl border border-border bg-background p-4 sm:p-5"
              aria-label="Available colours"
            >
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                Choose your colour
              </p>
              <h2 className="mt-2 text-xl font-black tracking-tight">
                See the available options before you order.
              </h2>
              <div className="mt-4 grid gap-3">
                {productVariants.map((variant) => {
                  const variantQuantity = variantQuantities[variant.id] ?? 0;
                  return (
                    <div
                      key={variant.id}
                      className={`flex min-w-0 items-center gap-3 rounded-2xl border p-3 ${selectedVariant?.id === variant.id ? "border-primary ring-2 ring-primary/20" : "border-border"}`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedVariantId(variant.id);
                          trackGoogleAnalytics("select_item", {
                            item_list_name: "YJ Baby school bag funnel",
                            item_id: variant.sku ?? variant.id,
                            item_name: product.name,
                            item_variant: variant.color ?? variant.name,
                            currency: product.currency,
                            value: variantPrice(variant, product),
                          });
                        }}
                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      >
                        {(isYjBag ? yjColourImage(variant) : variant.imageUrl) ? (
                          <img
                            src={
                              isYjBag
                                ? (yjColourImage(variant) ?? undefined)
                                : (variant.imageUrl ?? undefined)
                            }
                            alt={`${product.name} — ${variant.name}`}
                            loading="lazy"
                            decoding="async"
                            className="h-14 w-14 shrink-0 rounded-xl object-contain"
                          />
                        ) : (
                          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-muted/40 text-[10px] text-muted-foreground">
                            Image pending
                          </div>
                        )}
                        <span className="min-w-0 break-words text-sm font-semibold">
                          {variant.name}
                        </span>
                      </button>
                      <div
                        className="flex shrink-0 items-center gap-2"
                        aria-label={`Quantity for ${variant.name}`}
                      >
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            setVariantQuantities((current) => ({
                              ...current,
                              [variant.id]: Math.max(0, variantQuantity - 1),
                            }))
                          }
                          aria-label={`Remove one ${variant.name}`}
                        >
                          −
                        </Button>
                        <span className="w-5 text-center text-sm font-bold">{variantQuantity}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            setVariantQuantities((current) => ({
                              ...current,
                              [variant.id]: variantQuantity + 1,
                            }))
                          }
                          aria-label={`Add one ${variant.name}`}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}
          {isYjBag ? (
            <section
              className="mb-5 rounded-3xl border border-border bg-background p-4 sm:p-5"
              aria-label="Customer reviews"
            >
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                What customers say
              </p>
              <img
                src="/assets/yj-baby-trust-schoolday.webp"
                alt="Child carrying a navy YJ Baby school bag with red and teal-green bags nearby"
                width={1400}
                height={1050}
                loading="lazy"
                decoding="async"
                className="mt-4 aspect-[4/3] w-full rounded-2xl object-contain"
              />
              <h2 className="mt-4 text-xl font-black tracking-tight">
                Real feedback belongs to real deliveries.
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                We are collecting verified feedback from YJ Baby customers after their orders are
                delivered. Once customers share their experience, this section will feature genuine
                comments about storage, material, carrying design, and everyday use. We do not copy
                testimonials from another store or create customer quotes.
              </p>
              <p className="mt-3 text-xs font-semibold text-muted-foreground">
                Review status: awaiting verified YJ Baby customer submissions.
              </p>
            </section>
          ) : null}
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Your offer
          </p>
          <h2 className="mt-2 text-xl font-black">{product.name}</h2>
          {productVariants.length > 0 ? (
            <div className="mt-5 space-y-2">
              <p className="text-sm font-semibold">Your selected colours</p>
              <div className="space-y-2">
                {productVariants
                  .filter((variant) => (variantQuantities[variant.id] ?? 0) > 0)
                  .map((variant) => (
                    <div
                      key={variant.id}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="min-w-0 break-words">{variant.name}</span>
                      <span className="shrink-0 font-bold">× {variantQuantities[variant.id]}</span>
                    </div>
                  ))}
              </div>
            </div>
          ) : null}
          <div className="mt-5 flex items-end justify-between gap-3">
            <span className="text-3xl font-black">
              {product.currency} {(hasSelection ? selectedTotal : price).toLocaleString()}
            </span>
            <span className="text-xs text-muted-foreground">
              {outOfStock ? "Out of stock" : "Available to order"}
            </span>
          </div>
          <form
            id="yj-order-form"
            ref={orderFormRef}
            className="mt-6 scroll-mt-6 space-y-4 border-t border-border pt-5"
            onSubmit={handleFirstPageCheckout}
          >
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                Finish your order below
              </p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Choose your colour and quantity, add your delivery details, and review your order
                before continuing to secure checkout. Saved details may be filled automatically on
                this device.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="min-w-0 space-y-1.5 sm:col-span-2">
                <Label htmlFor="funnel-first-name">First name *</Label>
                <Input
                  id="funnel-first-name"
                  required
                  autoComplete="given-name"
                  value={customer.firstName}
                  onChange={(event) => setCustomer({ ...customer, firstName: event.target.value })}
                />
              </div>
              <div className="min-w-0 space-y-1.5">
                <Label htmlFor="funnel-phone">Phone *</Label>
                <Input
                  id="funnel-phone"
                  required
                  inputMode="tel"
                  autoComplete="tel"
                  value={customer.phone}
                  onChange={(event) => setCustomer({ ...customer, phone: event.target.value })}
                />
              </div>
              <div className="min-w-0 space-y-1.5">
                <Label htmlFor="funnel-email">Email</Label>
                <Input
                  id="funnel-email"
                  type="email"
                  autoComplete="email"
                  value={customer.email}
                  onChange={(event) => setCustomer({ ...customer, email: event.target.value })}
                />
              </div>
              <div className="min-w-0 space-y-1.5 sm:col-span-2">
                <Label htmlFor="funnel-address">Street, building or house number *</Label>
                <Input
                  id="funnel-address"
                  required
                  autoComplete="street-address"
                  value={customer.address}
                  onChange={(event) => setCustomer({ ...customer, address: event.target.value })}
                />
              </div>
              <div className="min-w-0 space-y-1.5">
                <Label htmlFor="funnel-county">County *</Label>
                <Input
                  id="funnel-county"
                  required
                  autoComplete="address-level1"
                  value={customer.county}
                  onChange={(event) => setCustomer({ ...customer, county: event.target.value })}
                />
              </div>
              <div className="min-w-0 space-y-1.5">
                <Label htmlFor="funnel-town">Town or area *</Label>
                <Input
                  id="funnel-town"
                  required
                  autoComplete="address-level2"
                  value={customer.town}
                  onChange={(event) => setCustomer({ ...customer, town: event.target.value })}
                />
              </div>
              <div className="min-w-0 space-y-1.5 sm:col-span-2">
                <Label htmlFor="funnel-delivery-details">Landmark or delivery instructions</Label>
                <Textarea
                  id="funnel-delivery-details"
                  autoComplete="street-address"
                  value={customer.deliveryDetails}
                  onChange={(event) =>
                    setCustomer({ ...customer, deliveryDetails: event.target.value })
                  }
                />
              </div>
            </div>
            {profileLoaded ? (
              <p className="text-xs text-primary">
                Saved details were filled from this browser. Please review them before continuing.
              </p>
            ) : null}
            <Button
              type="submit"
              className="w-full rounded-xl"
              disabled={outOfStock || !hasSelection}
            >
              {outOfStock
                ? "Currently unavailable"
                : hasSelection
                  ? "Order Now"
                  : "Choose a colour to get started"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
          <p className="mt-3 text-center text-xs leading-5 text-muted-foreground">
            {effectiveLandingCopy?.deliveryNote ??
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
    </main>
  );
}
