import { Link } from "@tanstack/react-router";
import { Package } from "lucide-react";
import { ResponsiveProductImage } from "@/components/storefront/ResponsiveProductImage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  effectivePrice,
  formatMoney,
  isOnSale,
  productImage,
  productSecondaryImage,
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
  const secondaryImage = productSecondaryImage(product);
  const soldOut = product.status === "out_of_stock";

  return (
    <article className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border bg-card transition-shadow hover:shadow-lg sm:rounded-3xl">
      <Link
        to="/shop/product/$id"
        params={{ id: product.id }}
        className="dailygear-product-media relative block aspect-[0.92] overflow-hidden bg-muted sm:aspect-square"
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
            <div className="flex flex-col items-center gap-2 text-center">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-background/80 text-primary ring-1 ring-inset ring-border/60">
                <Package className="h-7 w-7" aria-hidden="true" />
              </span>
              <span className="max-w-[12rem] text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Product thumbnail unavailable
              </span>
            </div>
          </div>
        )}
        {secondaryImage ? (
          <ResponsiveProductImage
            src={secondaryImage}
            alt={`${product.name} alternate view`}
            width={800}
            height={800}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          />
        ) : null}
        <div className="absolute left-3 top-3 flex flex-col gap-1">
          {isOnSale(product) ? <Badge className="rounded-full">Sale</Badge> : null}
          {soldOut ? (
            <Badge variant="secondary" className="rounded-full">
              Sold out
            </Badge>
          ) : null}
        </div>
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-2.5 p-3 sm:gap-3 sm:p-5">
        <div className="min-w-0 space-y-1">
          <Link
            to="/shop/product/$id"
            params={{ id: product.id }}
            className="min-h-[2.25rem] line-clamp-2 break-words text-balance text-[13px] font-semibold leading-[1.18] hover:underline sm:min-h-[2.5rem] sm:text-sm sm:leading-snug"
          >
            {product.name}
          </Link>
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
            <span className="text-sm font-bold sm:text-base">{formatMoney(price, currency)}</span>
            {isOnSale(product) ? (
              <span className="text-xs text-muted-foreground line-through">
                {formatMoney(Number(product.price), currency)}
              </span>
            ) : null}
          </div>
        </div>

        <p className="min-h-[2.5rem] line-clamp-2 break-words text-pretty text-[11px] leading-5 text-muted-foreground sm:min-h-[3.75rem] sm:line-clamp-3 sm:text-xs sm:leading-relaxed">
          {soldOut
            ? "Currently unavailable. Browse the collection for another option."
            : (product.short_description ??
              "Choose the option that fits your needs, review the details, and continue to checkout.")}
        </p>

        <Button
          asChild
          className="dailygear-product-cta mt-auto h-10 w-full rounded-xl px-2 text-xs sm:h-11 sm:px-4 sm:text-sm"
        >
          <Link to="/shop/product/$id" params={{ id: product.id }}>
            {soldOut ? "View details" : "Choose options & order"}
          </Link>
        </Button>
      </div>
    </article>
  );
}
