import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCard } from "@/components/storefront/ProductCard";
import { useStoreCategories, useStoreProducts, useStorefront } from "@/lib/storefront/api";

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
    links: [{ rel: "canonical", href: "https://alexos-digital-core.lovable.app/shop" }],
  }),
  component: StoreHome,
});

function StoreHome() {
  const { data: store } = useStorefront();
  const { data: categories } = useStoreCategories(store?.user_id);
  const featured = useStoreProducts(store?.user_id, { limit: 8 });
  const currency = store?.currency ?? "KES";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12">
      <section className="overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="grid items-center gap-8 p-6 sm:p-12 lg:grid-cols-2">
          <div className="min-w-0 space-y-5">
            <span className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs font-medium">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              {store?.tagline ?? "New season, new essentials"}
            </span>
            <h1 className="text-3xl font-black leading-tight tracking-tight sm:text-5xl">
              {store?.hero_headline ?? "Everyday gear that actually lasts"}
            </h1>
            <p className="max-w-prose text-sm text-muted-foreground sm:text-base">
              {store?.hero_subheadline ??
                "Carefully chosen products, honest pricing and delivery you can plan around."}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-xl">
                <Link to="/shop/products">
                  Shop all products <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-xl">
                <Link to="/shop/track">Track an order</Link>
              </Button>
            </div>
          </div>
          <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-muted">
            {store?.hero_image_url ? (
              <img
                src={store.hero_image_url}
                alt={store.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                Add a hero image in Storefront settings
              </div>
            )}
          </div>
        </div>
      </section>

      {categories?.length ? (
        <section className="mt-12 space-y-4">
          <h2 className="text-xl font-bold tracking-tight">Shop by category</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {categories.slice(0, 10).map((c) => (
              <Link
                key={c.id}
                to="/shop/products"
                search={{ category: c.id }}
                className="rounded-2xl border bg-card p-4 text-sm font-medium transition-colors hover:border-primary hover:bg-muted/50"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-12 space-y-4">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-xl font-bold tracking-tight">Featured products</h2>
          <Link to="/shop/products" className="text-sm font-medium text-primary hover:underline">
            View all
          </Link>
        </div>

        {featured.isLoading ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-3xl" />
            ))}
          </div>
        ) : featured.data?.length ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {featured.data.map((p) => (
              <ProductCard key={p.id} product={p} currency={currency} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed p-12 text-center text-sm text-muted-foreground">
            No products published yet. Add products and publish your storefront to see them here.
          </div>
        )}
      </section>
    </div>
  );
}
