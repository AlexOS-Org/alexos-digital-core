import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { CreditCard, Package, Plus, ShoppingCart, Truck, Zap } from "lucide-react";
import { PageHeader } from "@/components/dailygear/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCommerceData } from "@/lib/dailygear/useCommerceData";
import { useOrderCart } from "@/lib/dailygear/useOrderCart";
import { DG_CURRENCY } from "@/lib/dailygear/constants";

export const Route = createFileRoute("/_authenticated/e-commerce/store")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Store preview | DailyGear" },
      {
        name: "description",
        content: "Preview your DailyGear storefront and build orders from catalogue products.",
      },
      { property: "og:title", content: "Store preview | DailyGear" },
      {
        property: "og:description",
        content: "Preview your storefront, add products to cart and continue to checkout.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: StorePage,
});

function money(value: number) {
  return `${DG_CURRENCY} ${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function StorePage() {
  const navigate = useNavigate();
  const { products, context, isLoading } = useCommerceData();
  const cart = useOrderCart();

  const activeProducts = useMemo(
    () => products.filter((product) => product.status === "active"),
    [products],
  );

  const inCart = useMemo(() => new Set(cart.items.map((item) => item.product_id)), [cart.items]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Store preview"
        description="Browse your catalogue, add products to an order and continue to checkout with shipping, payment and customer details."
        actions={
          <Button
            onClick={() => navigate({ to: "/e-commerce/checkout" })}
            disabled={cart.items.length === 0}
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Checkout ({cart.items.length})
          </Button>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[320px_1fr]">
        <Card className="rounded-3xl border-border">
          <CardHeader>
            <CardTitle>Order cart</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-3xl border border-border p-4 bg-muted/50">
              <div className="flex items-center gap-3">
                <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    {cart.items.length} item{cart.items.length === 1 ? "" : "s"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Cart contents are stored in your browser.
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              {cart.items.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Start by adding products to the cart.
                </p>
              ) : (
                cart.items.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-border p-3">
                    <p className="font-medium truncate">{item.name || "Unnamed item"}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.quantity} × {money(item.unit_price)}
                    </p>
                  </div>
                ))
              )}
            </div>
            <div className="rounded-3xl border border-border p-4 bg-background">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Subtotal</span>
                <span>{money(cart.total)}</span>
              </div>
              <div className="mt-3 grid gap-2">
                <Button
                  variant="outline"
                  onClick={() => navigate({ to: "/e-commerce/checkout" })}
                  disabled={cart.items.length === 0}
                >
                  Continue to checkout
                </Button>
                <Button variant="ghost" onClick={cart.clear} disabled={cart.items.length === 0}>
                  Clear cart
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="rounded-3xl border-border overflow-hidden">
            <div className="p-6 bg-primary/5">
              <div className="flex items-center gap-3">
                <Zap className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-semibold">
                    Sell more with an internal storefront preview
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Add products to an order quickly and see shipping, discounts and payment
                    selections in one place.
                  </p>
                </div>
              </div>
            </div>
            <CardContent className="grid gap-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-border p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Products active
                  </p>
                  <p className="mt-2 text-2xl font-semibold">{activeProducts.length}</p>
                </div>
                <div className="rounded-2xl border border-border p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Store status
                  </p>
                  <Badge variant={activeProducts.length ? "default" : "secondary"}>
                    {activeProducts.length ? "Ready" : "No active products"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-border">
            <CardHeader>
              <CardTitle>Quick actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" onClick={() => navigate({ to: "/e-commerce/products" })}>
                Manage catalogue
              </Button>
              <Button variant="outline" onClick={() => navigate({ to: "/e-commerce/orders" })}>
                Review orders
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Available products</h2>
            <p className="text-sm text-muted-foreground">
              Products with stock and active status are ready for orders.
            </p>
          </div>
          <Button variant="outline" onClick={() => cart.addBlankItem()}>
            <Plus className="mr-2 h-4 w-4" /> Add custom line
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-4 lg:grid-cols-3">
            {[...Array(3)].map((_, index) => (
              <Skeleton key={index} className="h-44 rounded-3xl" />
            ))}
          </div>
        ) : activeProducts.length === 0 ? (
          <Card className="rounded-2xl border-dashed">
            <CardContent className="py-14 text-center text-sm text-muted-foreground">
              No active products to show. Add or publish products in your catalogue first.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            {activeProducts.map((product) => (
              <Card key={product.id} className="rounded-3xl border-border">
                <CardContent className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.sku ?? "No SKU"}</p>
                    </div>
                    <Badge variant={product.stock_quantity > 0 ? "secondary" : "destructive"}>
                      {product.stock_quantity > 0 ? "In stock" : "Out of stock"}
                    </Badge>
                  </div>
                  <p className="text-2xl font-semibold">
                    {money(Number(product.sale_price ?? product.price))}
                  </p>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {product.description ?? "No product description available."}
                  </p>
                </CardContent>
                <CardFooter className="flex flex-wrap gap-2">
                  <Button
                    className="flex-1"
                    onClick={() =>
                      cart.addItem({
                        product_id: product.id,
                        variant_id: null,
                        name: product.name,
                        sku: product.sku,
                        quantity: 1,
                        unit_price: Number(product.sale_price ?? product.price),
                        unit_cost: Number(product.cost_price ?? 0),
                      })
                    }
                    disabled={product.stock_quantity <= 0}
                  >
                    Add to cart
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate({ to: "/e-commerce/checkout" })}
                  >
                    Buy now
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
