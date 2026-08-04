import { Link } from "@tanstack/react-router";
import { ShoppingBag, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cartStore } from "@/lib/storefront/cart";
import {
  effectivePrice,
  formatMoney,
  isOnSale,
  productImage,
  type StoreProduct,
} from "@/lib/storefront/api";
import { toast } from "sonner";

interface Props {
  product: StoreProduct;
  currency: string;
}

/** Retail product tile — image, price, stock signal and a one-tap add. */
export function ProductCard({ product, currency }: Props) {
  const price = effectivePrice(product);
  const image = productImage(product);
  const soldOut = Number(product.stock_quantity) <= 0;

  function add() {
    cartStore.add({
      productId: product.id,
      variantId: null,
      name: product.name,
      sku: product.sku,
      price,
      image,
      maxQuantity: Number(product.stock_quantity),
    });
    toast.success(`${product.name} added to bag`);
  }

  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl border bg-card transition-shadow hover:shadow-lg">
      <Link
        to="/shop/product/$id"
        params={{ id: product.id }}
        className="relative block aspect-square overflow-hidden bg-muted"
      >
        {image ? (
          <img
            src={image}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <ShoppingBag className="h-10 w-10" />
          </div>
        )}
        <div className="absolute left-3 top-3 flex flex-col gap-1">
          {isOnSale(product) ? <Badge className="rounded-full">Sale</Badge> : null}
          {soldOut ? (
            <Badge variant="secondary" className="rounded-full">
              Sold out
            </Badge>
          ) : null}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="min-w-0 space-y-1">
          <Link
            to="/shop/product/$id"
            params={{ id: product.id }}
            className="line-clamp-2 text-sm font-semibold leading-snug hover:underline"
          >
            {product.name}
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold">{formatMoney(price, currency)}</span>
            {isOnSale(product) ? (
              <span className="text-xs text-muted-foreground line-through">
                {formatMoney(Number(product.price), currency)}
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Star className="h-3.5 w-3.5 fill-current text-amber-500" />
          <span>Trusted seller</span>
        </div>

        <Button className="mt-auto w-full rounded-xl" disabled={soldOut} onClick={add}>
          {soldOut ? "Sold out" : "Add to bag"}
        </Button>
      </div>
    </article>
  );
}
