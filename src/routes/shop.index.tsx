import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BatteryCharging,
  CheckCircle2,
  Compass,
  PackageCheck,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Watch,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCard } from "@/components/storefront/ProductCard";
import { StoreConfidenceStrip } from "@/components/storefront/StoreConfidenceStrip";
import { StoreJourneyGuide } from "@/components/storefront/StoreJourneyGuide";
import { StoreVisualValueGrid } from "@/components/storefront/StoreVisualValueGrid";
import { useStoreCategories, useStoreProducts, useStorefront } from "@/lib/storefront/api";
import dailyGearHeroPremiumWide from "@/assets/visuals/dailygear-hero-premium-wide.jpg";
import dailyGearHeroPremiumMobile from "@/assets/visuals/dailygear-hero-premium-mobile.jpg";

export const Route = createFileRoute("/shop/")({
  head: () => ({
    meta: [
      { title: "DailyGear — Everyday essentials, delivered" },
      {
        name: "description",
        content:
          "Shop curated everyday gear with fast local delivery, secure checkout and easy returns.",
      },
      { property: "og:title", content: "DailyGear — Everyday essentials, delivered" },
      {
        property: "og:description",
        content: "Curated everyday gear with fast delivery and secure checkout.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StoreHome,
});

const PILLARS = [
  { label: "Carry", copy: "Bags and daily movement", icon: ShoppingBag },
  { label: "Power", copy: "Charge the day ahead", icon: BatteryCharging },
  { label: "Style", copy: "Details that finish the look", icon: Watch },
];

function StoreHome() {
  const { data: store } = useStorefront();
  const { data: categories } = useStoreCategories(store?.user_id);
  const featured = useStoreProducts(store?.user_id, { limit: 8 });
  const currency = store?.currency ?? "KES";
  const primaryCategories = (categories ?? []).filter((category) => !category.parent_id);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-5 sm:pt-8 4k:max-w-[1800px] 4k:px-8">
      <section className="relative isolate overflow-hidden rounded-[2rem] border bg-card shadow-[0_24px_80px_-48px_hsl(var(--foreground)/0.55)]">
        <div className="grid lg:grid-cols-[1.02fr_0.98fr]">
          <div className="relative flex min-h-[470px] flex-col justify-between overflow-hidden bg-primary p-6 text-primary-foreground sm:p-10 lg:min-h-[560px] lg:p-12">
            <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full border border-primary-foreground/10 bg-primary-foreground/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-28 -left-24 h-80 w-80 rounded-full border border-primary-foreground/10 bg-primary-foreground/10 blur-3xl" />
            <div className="relative space-y-6">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground/75">
                <span className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1.5">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  {store?.tagline ?? "Everyday, elevated"}
                </span>
                <span className="rounded-full border border-primary-foreground/20 px-3 py-1.5">
                  DailyGear / KE
                </span>
              </div>
              <div className="max-w-xl space-y-4">
                <h1 className="text-4xl font-black leading-[0.98] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
                  {store?.hero_headline ?? "Everyday gear that actually lasts"}
                </h1>
                <p className="max-w-lg text-sm leading-relaxed text-primary-foreground/75 sm:text-base">
                  {store?.hero_subheadline ??
                    "Carefully chosen pieces for how the day moves — from the first commute to the last errand."}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  asChild
                  size="lg"
                  className="rounded-xl bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                >
                  <Link to="/shop/products">
                    Explore the collection <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="rounded-xl border-primary-foreground/25 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                >
                  <Link to="/shop/track">Track an order</Link>
                </Button>
              </div>
            </div>

            <div className="relative mt-10 grid grid-cols-3 gap-2 border-t border-primary-foreground/15 pt-4 text-xs text-primary-foreground/75 sm:gap-4">
              <div>
                <p className="font-bold text-primary-foreground">Curated</p>
                <p className="mt-1">Less clutter, better choices</p>
              </div>
              <div>
                <p className="font-bold text-primary-foreground">Transparent</p>
                <p className="mt-1">Clear options and policies</p>
              </div>
              <div>
                <p className="font-bold text-primary-foreground">Connected</p>
                <p className="mt-1">Support after checkout</p>
              </div>
            </div>
          </div>

          <div className="relative min-h-[330px] overflow-hidden bg-muted lg:min-h-[560px]">
            <picture className="block h-full w-full">
              <source media="(max-width: 640px)" srcSet={dailyGearHeroPremiumMobile} />
              <img
                src={store?.hero_image_url ?? dailyGearHeroPremiumWide}
                alt={store?.hero_image_url ? store.name : ""}
                fetchPriority="high"
                decoding="async"
                className="h-full w-full object-cover"
              />
            </picture>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
            <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4 sm:bottom-7 sm:left-7 sm:right-7">
              <div className="rounded-2xl border border-white/20 bg-black/25 p-4 text-white shadow-lg backdrop-blur-md">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">
                  The DailyGear edit
                </p>
                <p className="mt-1 text-sm font-semibold">Carry · power · style</p>
              </div>
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/20 bg-black/25 text-white backdrop-blur-md">
                <Compass className="h-5 w-5" aria-hidden="true" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <StoreConfidenceStrip />
      <StoreJourneyGuide />
      <StoreVisualValueGrid />

      <section
        className="mt-10 grid gap-3 md:grid-cols-3"
        aria-label="DailyGear collection pillars"
      >
        {PILLARS.map((pillar) => (
          <Link
            key={pillar.label}
            to="/shop/products"
            className="group flex items-center gap-4 rounded-2xl border bg-card p-4 transition duration-300 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
              <pillar.icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-bold group-hover:text-primary">
                {pillar.label}
              </span>
              <span className="mt-1 block text-xs text-muted-foreground">{pillar.copy}</span>
            </span>
            <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
          </Link>
        ))}
      </section>


      {primaryCategories.length ? (
        <section className="mt-14 space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                Browse the edit
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">Shop by category</h2>
            </div>
            <Link
              to="/shop/products"
              className="text-sm font-semibold text-primary hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {primaryCategories.map((category) => (
              <Link
                key={category.id}
                to="/shop/products"
                search={{ category: category.id }}
                className="group relative overflow-hidden rounded-2xl border bg-card p-5 transition duration-300 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
              >
                <span className="absolute -right-7 -top-7 h-20 w-20 rounded-full bg-primary/10 blur-2xl transition group-hover:bg-primary/20" />
                <span className="relative block text-sm font-bold group-hover:text-primary">
                  {category.name}
                </span>
                <ArrowRight className="relative mt-6 h-4 w-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-14 space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              The current drop
            </p>
            <h2 className="mt-1 text-2xl font-black tracking-tight">Featured products</h2>
          </div>
          <Link to="/shop/products" className="text-sm font-semibold text-primary hover:underline">
            View all
          </Link>
        </div>

        {featured.isLoading ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[...Array(4)].map((_, index) => (
              <Skeleton key={index} className="h-80 rounded-3xl" />
            ))}
          </div>
        ) : featured.data?.length ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {featured.data.map((product) => (
              <ProductCard key={product.id} product={product} currency={currency} />
            ))}
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-[2rem] border bg-gradient-to-br from-card via-card to-primary/5 p-6 sm:p-10">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div className="max-w-2xl">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <PackageCheck className="h-5 w-5" aria-hidden="true" />
                </div>
                <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  The first drop is being prepared
                </p>
                <h3 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                  Good gear is worth getting right.
                </h3>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
                  The storefront is ready. The catalogue is being checked for current images,
                  options, prices and availability before it is opened for orders.
                </p>
                <div className="mt-6 flex flex-wrap gap-x-5 gap-y-3 text-xs font-medium text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" /> Real product images
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" /> Clear checkout
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Compass className="h-4 w-4 text-primary" /> Support when needed
                  </span>
                </div>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Button asChild className="rounded-xl">
                    <Link to="/shop/faq">See how DailyGear works</Link>
                  </Button>
                  <Button asChild variant="outline" className="rounded-xl">
                    <Link to="/shop/contact">Contact the store</Link>
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:w-[260px] lg:grid-cols-1">
                {[
                  { label: "Select", copy: "Choose the right option", icon: Compass },
                  { label: "Review", copy: "See price and payment", icon: ShieldCheck },
                  { label: "Track", copy: "Keep the next step close", icon: PackageCheck },
                ].map((step) => (
                  <div key={step.label} className="rounded-2xl border bg-background/70 p-3 sm:p-4">
                    <step.icon className="h-4 w-4 text-primary" aria-hidden="true" />
                    <p className="mt-3 text-xs font-bold">{step.label}</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                      {step.copy}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
