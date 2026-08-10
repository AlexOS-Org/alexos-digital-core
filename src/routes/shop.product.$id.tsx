import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Check,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Truck,
  Undo2,
  Zap,
} from "lucide-react";
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
import { cartStore, useRecentlyViewed } from "@/lib/storefront/cart";
import {
  effectivePrice,
  formatMoney,
  isOnSale,
  productImage,
  useStoreProduct,
  useStoreProducts,
  useStorefront,
} from "@/lib/storefront/api";

export const Route = createFileRoute("/shop/product/$id")({
  head: ({ params }) => ({
    meta: [
      { title: "Product details | DailyGear" },
      { name: "description", content: "Product details, pricing and delivery information." },
      { property: "og:title", content: "Product details | DailyGear" },
      { property: "og:description", content: "Product details, pricing and delivery information." },
      { property: "og:type", content: "product" },
    ],
    links: [
      {
        rel: "canonical",
        href: `https://alexos-digital-core.lovable.app/shop/product/${params.id}`,
      },
    ],
  }),
  component: ProductDetail,
});

function ProductDetail() {
  const { id } = Route.useParams();
  const { data: store } = useStorefront();
  const { data: product, isLoading } = useStoreProduct(id);
  const related = useStoreProducts(store?.user_id, { limit: 4 });
  const { track } = useRecentlyViewed();
  const [qty, setQty] = useState(1);
  const [active, setActive] = useState(0);
  const currency = store?.currency ?? "KES";

  useEffect(() => {
    if (product) track(product.id);
  }, [product, track]);

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
  const price = effectivePrice(product);
  const soldOut = Number(product.stock_quantity) <= 0;
  const isInverter = /150w.*car.*inverter|car.*inverter.*150w/i.test(product.name);

  function add() {
    cartStore.add(
      {
        productId: product.id,
        variantId: null,
        name: product.name,
        sku: product.sku,
        price,
        image: productImage(product),
        maxQuantity: Number(product.stock_quantity),
      },
      qty,
    );
    toast.success(`${product.name} added to bag`);
  }

  if (isInverter) {
    return (
      <InverterLanding
        product={product}
        price={price}
        currency={currency}
        images={images}
        soldOut={soldOut}
        qty={qty}
        setQty={setQty}
        active={active}
        setActive={setActive}
        add={add}
      />
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <nav className="mb-6 text-xs text-muted-foreground">
        <Link to="/shop" className="hover:text-foreground">Home</Link>
        <span className="px-2">/</span>
        <Link to="/shop/products" className="hover:text-foreground">Shop</Link>
        <span className="px-2">/</span>
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="aspect-square overflow-hidden rounded-3xl border bg-muted">
            {images[active] ? (
              <img src={images[active]} alt={product.name} className="h-full w-full object-cover" />
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
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {isOnSale(product) ? <Badge className="rounded-full">Sale</Badge> : null}
              <Badge variant={soldOut ? "secondary" : "outline"} className="rounded-full">
                {soldOut ? "Sold out" : `${product.stock_quantity} in stock`}
              </Badge>
            </div>
            <h1 className="text-3xl font-black tracking-tight">{product.name}</h1>
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-bold">{formatMoney(price, currency)}</span>
              {isOnSale(product) ? (
                <span className="text-sm text-muted-foreground line-through">{formatMoney(Number(product.price), currency)}</span>
              ) : null}
            </div>
            {product.description ? <p className="text-sm leading-relaxed text-muted-foreground">{product.description}</p> : null}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-xl border">
              <Button variant="ghost" size="icon" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease">
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-10 text-center text-sm font-semibold">{qty}</span>
              <Button variant="ghost" size="icon" onClick={() => setQty((q) => Math.min(Number(product.stock_quantity) || 1, q + 1))} aria-label="Increase">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <Button size="lg" className="flex-1 rounded-xl" disabled={soldOut} onClick={add}>
              {soldOut ? "Sold out" : "Add to bag"}
            </Button>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            {[
              { icon: Truck, label: "Fast delivery" },
              { icon: ShieldCheck, label: "Secure checkout" },
              { icon: Undo2, label: "7-day returns" },
            ].map((t) => (
              <div key={t.label} className="flex items-center gap-2 rounded-xl border bg-card p-3 text-xs">
                <t.icon className="h-4 w-4 shrink-0 text-primary" />
                {t.label}
              </div>
            ))}
          </div>

          <Accordion type="single" collapsible className="rounded-2xl border px-4">
            <AccordionItem value="delivery">
              <AccordionTrigger className="text-sm">Delivery & returns</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                Orders are dispatched within 24 hours. Returns accepted within 7 days of delivery in original condition.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="details">
              <AccordionTrigger className="text-sm">Product details</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                {product.sku ? `SKU ${product.sku}. ` : ""}{product.description ?? "Full specifications available on request."}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      {related.data?.length ? (
        <section className="mt-16 space-y-4">
          <h2 className="text-xl font-bold tracking-tight">You may also like</h2>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {related.data.filter((p) => p.id !== product.id).slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} currency={currency} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function InverterLanding({
  product,
  price,
  currency,
  images,
  soldOut,
  qty,
  setQty,
  active,
  setActive,
  add,
}: {
  product: any;
  price: number;
  currency: string;
  images: string[];
  soldOut: boolean;
  qty: number;
  setQty: (value: number | ((value: number) => number)) => void;
  active: number;
  setActive: (value: number) => void;
  add: () => void;
}) {
  const image = images[active] ?? images[0];
  const savings = isOnSale(product) ? Math.max(0, Number(product.price) - price) : 0;

  return (
    <div className="bg-background">
      <section className="relative overflow-hidden border-b bg-zinc-950 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:gap-14 lg:py-14">
          <div className="order-2 lg:order-1">
            <Badge className="rounded-full border-white/20 bg-white/10 px-3 py-1 text-white hover:bg-white/10">DailyGear New Arrival</Badge>
            <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
              Keep your devices powered wherever the road takes you.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-300 sm:text-lg">
              The 150W Car Power Inverter turns your vehicle's 12V power into practical AC power for everyday electronics while keeping USB devices charged on the move.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" className="rounded-xl bg-white px-7 text-zinc-950 hover:bg-zinc-100" disabled={soldOut} onClick={add}>
                {soldOut ? "Sold out" : "Order now"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-xl border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white">
                <a href="#why-own">See why you need it</a>
              </Button>
            </div>
            <div className="mt-7 grid grid-cols-3 gap-3 text-xs text-zinc-300 sm:max-w-xl">
              <TrustMini icon={<Zap className="h-4 w-4" />} text="150W output" />
              <TrustMini icon={<ShieldCheck className="h-4 w-4" />} text="Built-in protection" />
              <TrustMini icon={<Truck className="h-4 w-4" />} text="Kenya delivery" />
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <div className="overflow-hidden rounded-[2rem] bg-zinc-900 shadow-2xl ring-1 ring-white/10">
              {image ? (
                <img src={image} alt={product.name} className="aspect-square w-full object-cover" />
              ) : (
                <div className="flex aspect-square items-center justify-center bg-zinc-900 text-zinc-500">
                  <Zap className="h-20 w-20" />
                </div>
              )}
            </div>
            {images.length > 1 ? (
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {images.map((img, i) => (
                  <button key={img} onClick={() => setActive(i)} className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg ring-1 ring-white/20 ${i === active ? "ring-2 ring-white" : ""}`}>
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-[1fr_380px] lg:items-start">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">Why own one?</p>
            <h2 id="why-own" className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Power on the move, without carrying a full-size power station.</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <Benefit title="Charge more on the road" text="Power compatible small electronics from your vehicle when you are travelling, working remotely or waiting between appointments." />
              <Benefit title="Multiple connection options" text="Use the AC outlets and USB charging ports to keep everyday devices connected from one compact unit." />
              <Benefit title="Designed for vehicle use" text="A compact plug-in design keeps the inverter close at hand without taking over your dashboard or cabin." />
              <Benefit title="Protection built in" text="Multiple protection features help guard the inverter and connected equipment against common electrical faults." />
            </div>
          </div>

          <div className="rounded-3xl border bg-card p-6 shadow-sm lg:sticky lg:top-6">
            <p className="text-sm font-semibold text-muted-foreground">Limited-time DailyGear offer</p>
            <h3 className="mt-2 text-xl font-black">{product.name}</h3>
            <div className="mt-5 flex items-end gap-3">
              <span className="text-3xl font-black">{formatMoney(price, currency)}</span>
              {isOnSale(product) ? <span className="pb-1 text-sm text-muted-foreground line-through">{formatMoney(Number(product.price), currency)}</span> : null}
            </div>
            {savings > 0 ? <p className="mt-1 text-sm font-bold text-primary">Save {formatMoney(savings, currency)}</p> : null}
            <div className="mt-5 flex items-center rounded-xl border">
              <Button variant="ghost" size="icon" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity"><Minus className="h-4 w-4" /></Button>
              <span className="flex-1 text-center text-sm font-bold">{qty}</span>
              <Button variant="ghost" size="icon" onClick={() => setQty((q) => Math.min(Number(product.stock_quantity) || 1, q + 1))} aria-label="Increase quantity"><Plus className="h-4 w-4" /></Button>
            </div>
            <Button size="lg" className="mt-3 w-full rounded-xl" disabled={soldOut} onClick={add}>
              {soldOut ? "Sold out" : "Add to order"}
            </Button>
            <p className="mt-3 text-center text-xs text-muted-foreground">Checkout is quick. No account required.</p>
          </div>
        </div>
      </section>

      <section className="border-y bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">Perfect for everyday driving</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight">One compact backup for the moments you need power most.</h2>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              "Road trips & travel",
              "Work on the go",
              "Emergency backup",
              "Keeping USB devices charged",
            ].map((item) => (
              <div key={item} className="rounded-2xl border bg-background p-5">
                <Check className="h-5 w-5 text-primary" />
                <p className="mt-4 font-bold">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">Specifications</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight">Know what you are buying.</h2>
            <div className="mt-6 divide-y rounded-2xl border">
              {[
                ["Rated output", "150W"],
                ["Vehicle input", "12V / 24V variants — confirm your vehicle specification before ordering"],
                ["AC output", "For compatible low-power electronics"],
                ["USB charging", "Multiple USB charging ports"],
                ["Design", "Compact in-car power solution"],
              ].map(([label, value]) => (
                <div key={label} className="grid gap-2 p-4 sm:grid-cols-[150px_1fr]">
                  <span className="text-sm font-semibold">{label}</span>
                  <span className="text-sm text-muted-foreground">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-zinc-950 p-7 text-white sm:p-9">
            <ShieldCheck className="h-9 w-9" />
            <h2 className="mt-5 text-2xl font-black">Shop with confidence.</h2>
            <div className="mt-6 space-y-4 text-sm text-zinc-300">
              <TrustRow text="Secure DailyGear checkout" />
              <TrustRow text="Clear order confirmation after checkout" />
              <TrustRow text="Delivery information shown before you place the order" />
              <TrustRow text="Support available if your order needs attention" />
            </div>
            <Button size="lg" className="mt-8 w-full rounded-xl bg-white text-zinc-950 hover:bg-zinc-100" disabled={soldOut} onClick={add}>
              {soldOut ? "Sold out" : "Get the 150W inverter"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      <section className="border-t bg-background">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          <h2 className="text-2xl font-black">Frequently asked questions</h2>
          <Accordion type="single" collapsible className="mt-4 rounded-2xl border px-4">
            <AccordionItem value="devices">
              <AccordionTrigger>What can I power with it?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">Use it for compatible low-power electronics within the inverter's 150W rating. Always check the device's wattage before connecting it.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="vehicle">
              <AccordionTrigger>Will it work with my car?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">Check whether your vehicle provides the required input voltage and connector. The product listing should be matched to your vehicle before ordering.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="delivery">
              <AccordionTrigger>How do I order?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">Tap Order now, add the product to your bag and complete the short DailyGear checkout with your contact and delivery details.</AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>
    </div>
  );
}

function Benefit({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary"><Check className="h-4 w-4" /></div>
      <h3 className="mt-4 font-black">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
    </div>
  );
}

function TrustMini({ icon, text }: { icon: React.ReactNode; text: string }) {
  return <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-3"><span className="text-white">{icon}</span><span>{text}</span></div>;
}

function TrustRow({ text }: { text: string }) {
  return <div className="flex gap-3"><Check className="mt-0.5 h-4 w-4 shrink-0 text-white" /><span>{text}</span></div>;
}
