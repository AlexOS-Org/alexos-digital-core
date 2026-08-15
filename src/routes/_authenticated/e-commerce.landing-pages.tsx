import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Clock3,
  ShieldCheck,
  ShoppingBag,
  Truck,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/dailygear/PageHeader";
import { IntelligencePanel } from "@/components/dailygear/IntelligencePanel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCommerceData } from "@/lib/dailygear/useCommerceData";
import type { Product } from "@/lib/dailygear/types";
import { cartStore } from "@/lib/storefront/cart";
import {
  effectivePrice,
  formatMoney,
  isOnSale,
  productImage,
} from "@/lib/storefront/api";

export const Route = createFileRoute("/_authenticated/e-commerce/landing-pages")({
  head: () => ({
    meta: [
      { title: "Landing Pages | DailyGear" },
      {
        name: "description",
        content: "Build and preview conversion-focused DailyGear product landing pages.",
      },
      { property: "og:title", content: "Landing Pages | DailyGear" },
      {
        property: "og:description",
        content: "Build and preview conversion-focused DailyGear product landing pages.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LandingPagesPage,
});

function LandingPagesPage() {
  const navigate = useNavigate();
  const { products, context, isLoading, error } = useCommerceData();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedProduct = useMemo(
    () =>
      products.find((product) => product.id === selectedId) ??
      products.find((product) => /150w.*car.*inverter|car.*inverter.*150w/i.test(product.name)) ??
      products[0] ??
      null,
    [products, selectedId],
  );

  function openPreview(product: Product) {
    setSelectedId(product.id);
    window.setTimeout(() => document.getElementById("landing-preview")?.scrollIntoView({ behavior: "smooth" }), 0);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Landing Pages"
        description="Create conversion-focused product campaigns, preview the customer experience, and send shoppers into the existing DailyGear checkout."
        actions={
          <Button variant="outline" onClick={() => navigate({ to: "/e-commerce/store" })}>
            Store preview
          </Button>
        }
      />

      <IntelligencePanel kind="landing" ctx={context} ready={!isLoading} />

      <Card className="rounded-3xl border-border">
        <CardHeader>
          <CardTitle>Product campaigns</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading landing page previews…</p>
          ) : error ? (
            <p className="text-sm text-destructive">Unable to load products: {error.message}</p>
          ) : products.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-6">
              <p className="font-semibold">No DailyGear products are connected yet.</p>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                The landing-page engine is ready. Add the 150W Car Inverter to DailyGear Products and this screen will automatically bind the real price, stock and product images to the campaign.
              </p>
              <Button className="mt-4 rounded-xl" onClick={() => navigate({ to: "/e-commerce/products" })}>
                Add product
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => (
                <div key={product.id} className="rounded-3xl border border-border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{product.name}</p>
                      <p className="text-sm text-muted-foreground">{product.sku ?? "SKU missing"}</p>
                    </div>
                    <Badge variant={product.status === "active" ? "secondary" : "outline"}>
                      {product.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground line-clamp-3">
                    {product.description ?? "No product description yet. The campaign preview will use conversion-focused fallback copy."}
                  </p>
                  <div className="mt-4 flex gap-2">
                    <Button size="sm" onClick={() => openPreview(product)}>
                      Preview landing page
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => navigate({ to: "/e-commerce/products" })}>
                      Edit product
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <section id="landing-preview" className="scroll-mt-6">
        {selectedProduct ? (
          <LandingPagePreview product={selectedProduct} onOpenCheckout={() => navigate({ to: "/shop/cart" })} />
        ) : (
          <DemoLandingPage />
        )}
      </section>
    </div>
  );
}

function LandingPagePreview({
  product,
  onOpenCheckout,
}: {
  product: Product;
  onOpenCheckout: () => void;
}) {
  const [activeImage, setActiveImage] = useState(0);
  const price = effectivePrice(product);
  const originalPrice = Number(product.price);
  const savings = isOnSale(product) ? Math.max(0, originalPrice - price) : 0;
  const images = ((product.images ?? []) as string[]).filter(Boolean);
  const heroImage = images[activeImage] ?? productImage(product);
  const isInverter = /150w.*car.*inverter|car.*inverter.*150w/i.test(product.name);
  const soldOut = Number(product.stock_quantity) <= 0;

  function addToCart() {
    if (soldOut) {
      toast.error("This product is currently out of stock.");
      return;
    }
    cartStore.add(
      {
        productId: product.id,
        variantId: null,
        name: product.name,
        sku: product.sku,
        price,
        image: heroImage,
        maxQuantity: Number(product.stock_quantity),
      },
      1,
    );
    toast.success("Added to DailyGear bag");
    onOpenCheckout();
  }

  return (
    <div className="overflow-hidden rounded-[2rem] border bg-background shadow-sm">
      <div className="border-b bg-zinc-950 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[1fr_.9fr] lg:items-center lg:gap-14 lg:py-14">
          <div className="order-2 lg:order-1">
            <Badge className="rounded-full border-white/20 bg-white/10 px-3 py-1 text-white hover:bg-white/10">
              DailyGear New Arrival
            </Badge>
            <h2 className="mt-5 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">
              {isInverter ? "Keep your devices powered wherever the road takes you." : product.name}
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-300 sm:text-lg">
              {isInverter
                ? "The 150W Car Power Inverter gives you practical AC power from your vehicle while keeping everyday USB devices charged on the move."
                : product.description ?? "A practical DailyGear essential designed to make everyday life easier."}
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" className="rounded-xl bg-white px-7 text-zinc-950 hover:bg-zinc-100" disabled={soldOut} onClick={addToCart}>
                {soldOut ? "Sold out" : "Order now"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-xl border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white">
                <a href="#why-own">See why you need it</a>
              </Button>
            </div>
            <div className="mt-7 grid max-w-xl grid-cols-3 gap-3 text-xs text-zinc-300">
              <TrustMini icon={<Zap className="h-4 w-4" />} text={isInverter ? "150W output" : "Everyday essential"} />
              <TrustMini icon={<ShieldCheck className="h-4 w-4" />} text="Secure checkout" />
              <TrustMini icon={<Truck className="h-4 w-4" />} text="Kenya delivery" />
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <div className="aspect-square overflow-hidden rounded-[2rem] bg-zinc-900 ring-1 ring-white/10">
              {heroImage ? (
                <img src={heroImage} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-zinc-500">
                  <ShoppingBag className="h-20 w-20" />
                </div>
              )}
            </div>
            {images.length > 1 ? (
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {images.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    aria-label={`Show product image ${index + 1}`}
                    onClick={() => setActiveImage(index)}
                    className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg ring-1 ring-white/20 ${index === activeImage ? "ring-2 ring-white" : ""}`}
                  >
                    <img src={image} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:py-14">
        <div className="grid gap-10 lg:grid-cols-[1fr_360px] lg:items-start">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">Why own one?</p>
            <h3 id="why-own" className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
              {isInverter ? "Power on the move, without carrying a full-size power station." : "Built around the problem you actually want to solve."}
            </h3>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {isInverter ? (
                <>
                  <Benefit title="Charge more on the road" text="Power compatible small electronics from your vehicle when travelling, working remotely or waiting between appointments." />
                  <Benefit title="Multiple connection options" text="Use AC outlets and USB charging ports to keep everyday devices connected from one compact unit." />
                  <Benefit title="Designed for vehicle use" text="A compact plug-in design keeps the inverter close at hand without taking over your dashboard or cabin." />
                  <Benefit title="Protection built in" text="Multiple protection features help guard the inverter and connected equipment against common electrical faults." />
                </>
              ) : (
                <>
                  <Benefit title="Practical by design" text="Focused on a real everyday need, with simple controls and a straightforward customer experience." />
                  <Benefit title="Made for daily use" text="A useful addition to your routine, whether you are at home, at work or on the move." />
                  <Benefit title="Easy to order" text="Choose your product, add it to your bag and complete the simple DailyGear checkout." />
                  <Benefit title="Delivery across Kenya" text="DailyGear is built around clear delivery information and a customer-first ordering flow." />
                </>
              )}
            </div>

            <div className="mt-10 rounded-3xl border bg-muted/30 p-6">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">What you get</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {(isInverter
                  ? ["150W power inverter", "12V vehicle connection", "AC power outlets", "USB charging ports", "Compact travel-friendly design", "Built-in safety protection"]
                  : ["Quality DailyGear product", "Simple ordering experience", "Secure checkout", "Kenya delivery support", "Product support", "Clear pricing"]
                ).map((item) => (
                  <div key={item} className="flex items-center gap-3 text-sm">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Check className="h-4 w-4" />
                    </span>
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <TrustCard icon={<Truck />} title="Kenya delivery" text="Clear delivery details at checkout." />
              <TrustCard icon={<ShieldCheck />} title="Secure checkout" text="Your order details are handled securely." />
              <TrustCard icon={<Clock3 />} title="Quick ordering" text="Less friction between interest and purchase." />
            </div>
          </div>

          <div className="rounded-3xl border bg-card p-6 shadow-sm lg:sticky lg:top-6">
            <p className="text-sm font-semibold text-muted-foreground">Limited-time DailyGear offer</p>
            <h4 className="mt-2 text-xl font-black">{product.name}</h4>
            <div className="mt-5 flex items-end gap-3">
              <span className="text-3xl font-black">{formatMoney(price, "KES")}</span>
              {isOnSale(product) ? (
                <span className="pb-1 text-sm text-muted-foreground line-through">{formatMoney(originalPrice, "KES")}</span>
              ) : null}
            </div>
            {savings > 0 ? <p className="mt-1 text-sm font-bold text-primary">Save {formatMoney(savings, "KES")}</p> : null}
            <div className="mt-5 rounded-2xl border bg-muted/30 p-4">
              <div className="flex items-center justify-between text-sm">
                <span>Availability</span>
                <span className="font-semibold">{soldOut ? "Out of stock" : `${product.stock_quantity} available`}</span>
              </div>
            </div>
            <Button size="lg" className="mt-4 w-full rounded-xl" disabled={soldOut} onClick={addToCart}>
              {soldOut ? "Sold out" : "Order now"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Payment and delivery options are confirmed on the next step.
            </p>
          </div>
        </div>
      </div>

      <div className="border-t bg-zinc-50 px-5 py-10 sm:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">30-day confidence promise</p>
          <h3 className="mt-2 text-2xl font-black">Buy with confidence. If the product does not meet its listed specifications, contact DailyGear for support.</h3>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            This trust block is intentionally visible before checkout so the customer has the information needed to make a confident decision.
          </p>
        </div>
      </div>
    </div>
  );
}

function DemoLandingPage() {
  return (
    <div className="overflow-hidden rounded-[2rem] border bg-zinc-950 text-white shadow-sm">
      <div className="mx-auto max-w-5xl px-5 py-12 text-center sm:px-8 lg:py-20">
        <Badge className="rounded-full border-white/20 bg-white/10 text-white hover:bg-white/10">Landing page engine ready</Badge>
        <h2 className="mt-5 text-4xl font-black tracking-tight sm:text-6xl">150W Car Power Inverter</h2>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-zinc-300 sm:text-lg">
          The campaign structure is ready for the real DailyGear product record: benefit-led hero, feature-to-benefit proof, offer block, trust signals and a simple path into checkout.
        </p>
        <div className="mx-auto mt-8 grid max-w-3xl gap-3 text-left sm:grid-cols-2">
          {["Benefit-led hero", "Why Own One section", "Feature-to-benefit copy", "Offer + savings", "Trust / guarantee block", "Simple checkout hand-off"].map((item) => (
            <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-zinc-200">
              <Check className="h-4 w-4 text-emerald-300" />
              {item}
            </div>
          ))}
        </div>
        <p className="mt-8 text-sm text-zinc-400">Add the 150W Car Inverter under DailyGear → Products to bind live price, stock and images.</p>
      </div>
    </div>
  );
}

function Benefit({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border p-5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Check className="h-4 w-4" />
        </span>
        <div>
          <h4 className="font-bold">{title}</h4>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{text}</p>
        </div>
      </div>
    </div>
  );
}

function TrustMini({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-3">
      {icon}
      <span>{text}</span>
    </div>
  );
}

function TrustCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-2xl border p-4">
      <div className="flex items-center gap-2 font-semibold">
        <span className="text-primary">{icon}</span>
        {title}
      </div>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{text}</p>
    </div>
  );
}
