import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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

  function add() {
    if (!product) return;
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <nav className="mb-6 text-xs text-muted-foreground">
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
                <span className="text-sm text-muted-foreground line-through">
                  {formatMoney(Number(product.price), currency)}
                </span>
              ) : null}
            </div>
            {product.description ? (
              <p className="text-sm leading-relaxed text-muted-foreground">{product.description}</p>
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
                onClick={() => setQty((q) => Math.min(Number(product.stock_quantity) || 1, q + 1))}
                aria-label="Increase"
              >
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
              <div
                key={t.label}
                className="flex items-center gap-2 rounded-xl border bg-card p-3 text-xs"
              >
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
