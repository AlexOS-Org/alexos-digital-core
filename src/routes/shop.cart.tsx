import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/storefront/cart";
import { formatMoney, useStorefront } from "@/lib/storefront/api";

export const Route = createFileRoute("/shop/cart")({
  head: () => ({
    meta: [
      { title: "Your bag | DailyGear" },
      { name: "description", content: "Review the items in your bag before checkout." },
      { property: "og:title", content: "Your bag | DailyGear" },
      { property: "og:description", content: "Review the items in your bag before checkout." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const cart = useCart();
  const { data: store } = useStorefront();
  const currency = store?.currency ?? "KES";
  const threshold = Number(store?.free_shipping_threshold ?? 0);
  const shipping =
    cart.items.length === 0
      ? 0
      : threshold > 0 && cart.subtotal >= threshold
        ? 0
        : Number(store?.flat_shipping_fee ?? 0);

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <ShoppingBag className="mx-auto h-10 w-10 text-muted-foreground" />
        <h1 className="mt-4 text-2xl font-black">Your bag is empty</h1>
        <p className="mt-2 text-sm text-muted-foreground">Browse the catalogue to get started.</p>
        <Button asChild className="mt-6 rounded-xl">
          <Link to="/shop/products">Start shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-black tracking-tight">Your bag</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Review your items and quantities before checkout. Current price and availability are checked
        again when you place the order.
      </p>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-primary">
        <Link to="/shop/policies/$slug" params={{ slug: "shipping" }} className="hover:underline">
          Shipping
        </Link>
        <Link to="/shop/policies/$slug" params={{ slug: "returns" }} className="hover:underline">
          Returns & refunds
        </Link>
        <Link to="/shop/contact" className="hover:underline">
          Need help?
        </Link>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-3">
          {cart.items.map((line) => (
            <div
              key={`${line.productId}-${line.variantId ?? ""}`}
              className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 rounded-2xl border bg-card p-3"
            >
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-muted">
                {line.image ? (
                  <img src={line.image} alt={line.name} className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="min-w-0 space-y-2">
                <p className="truncate text-sm font-semibold">{line.name}</p>
                <p className="text-sm text-muted-foreground">{formatMoney(line.price, currency)}</p>
                <div className="flex items-center rounded-lg border w-fit">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() =>
                      cart.setQuantity(line.productId, line.variantId, line.quantity - 1)
                    }
                    aria-label="Decrease"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                  <span className="w-8 text-center text-sm">{line.quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() =>
                      cart.setQuantity(line.productId, line.variantId, line.quantity + 1)
                    }
                    aria-label="Increase"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <span className="text-sm font-bold">
                  {formatMoney(line.price * line.quantity, currency)}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => cart.remove(line.productId, line.variantId)}
                  aria-label="Remove item"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <aside className="h-fit space-y-3 rounded-2xl border bg-card p-5">
          <h2 className="text-sm font-semibold">Order summary</h2>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatMoney(cart.subtotal, currency)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Delivery</span>
            <span>{shipping === 0 ? "Free" : formatMoney(shipping, currency)}</span>
          </div>
          <div className="flex justify-between border-t pt-3 text-base font-bold">
            <span>Total</span>
            <span>{formatMoney(cart.subtotal + shipping, currency)}</span>
          </div>
          <Button asChild size="lg" className="w-full rounded-xl">
            <Link to="/shop/checkout">Checkout</Link>
          </Button>
          <Button asChild variant="ghost" className="w-full rounded-xl">
            <Link to="/shop/products">Continue shopping</Link>
          </Button>
        </aside>
      </div>
    </div>
  );
}
