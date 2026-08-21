import { Link } from "@tanstack/react-router";
import { ShoppingBag } from "lucide-react";
import { ResponsiveProductImage } from "@/components/storefront/ResponsiveProductImage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  effectivePrice,
  formatMoney,
  isOnSale,
  productImage,
  type StoreProduct,
} from "@/lib/storefront/api";

interface Props {
  product: StoreProduct;
  currency: string;
}

/** Retail product tile — exact stored image, price, stock signal and detail entry. */
export function ProductCard({ product, currency }: Props) {
  const price = effectivePrice(product);
  const image = productImage(product);
  const soldOut = Number(product.stock_quantity) <= 0;

  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl border bg-card transition-shadow hover:shadow-lg">
      <Link
        to="/shop/product/$id"
        params={{ id: product.id }}
        className="relative block aspect-square overflow-hidden bg-muted"
      >
        {image ? (
          <ResponsiveProductImage
            src={image}
            alt={product.name}
            width={800}
            height={800}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
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

        <p className="text-xs leading-relaxed text-muted-foreground">
          {soldOut
            ? "This listing is currently unavailable."
            : "View current stock and choose any available size or colour."}
        </p>

        <Button asChild className="mt-auto w-full rounded-xl">
          <Link to="/shop/product/$id" params={{ id: product.id }}>
            {soldOut ? "View details" : "View details & options"}
          </Link>
        </Button>
      </div>
    </article>
  );
}
