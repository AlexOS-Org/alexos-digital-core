import { createFileRoute, Link } from "@tanstack/react-router";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductCard } from "@/components/storefront/ProductCard";
import { StoreConfidenceStrip } from "@/components/storefront/StoreConfidenceStrip";
import {
  useStoreBrands,
  useStoreCategories,
  useStoreProducts,
  useStorefront,
} from "@/lib/storefront/api";

interface ProductSearch {
  q?: string;
  category?: string;
  brand?: string;
  sort?: "newest" | "price-asc" | "price-desc" | "name";
}

export const Route = createFileRoute("/shop/products")({
  validateSearch: (search: Record<string, unknown>): ProductSearch => ({
    q: typeof search["q"] === "string" ? search["q"] : undefined,
    category: typeof search["category"] === "string" ? search["category"] : undefined,
    brand: typeof search["brand"] === "string" ? search["brand"] : undefined,
    sort: ["newest", "price-asc", "price-desc", "name"].includes(String(search["sort"]))
      ? (search["sort"] as ProductSearch["sort"])
      : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Shop all products | DailyGear" },
      {
        name: "description",
        content: "Browse the full DailyGear catalogue — filter by category, brand and price.",
      },
      { property: "og:title", content: "Shop all products | DailyGear" },
      { property: "og:description", content: "Browse the full DailyGear catalogue." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: ProductsPage,
});

function ProductsPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data: store } = useStorefront();
  const { data: categories } = useStoreCategories(store?.user_id);
  const { data: brands } = useStoreBrands(store?.user_id);
  const selectedCategory = (categories ?? []).find(
    (category) => category.slug === search.category || category.id === search.category,
  );
  const categoryNames = new Map((categories ?? []).map((category) => [category.id, category.name]));
  const products = useStoreProducts(store?.user_id, {
    search: search.q,
    categoryId: selectedCategory?.id ?? null,
    brandId: search.brand ?? null,
    sort: search.sort ?? "newest",
  });
  const currency = store?.currency ?? "KES";

  function update(patch: Partial<ProductSearch>) {
    navigate({ search: (prev: ProductSearch) => ({ ...prev, ...patch }) });
  }

  const hasFilters = Boolean(search.q || search.category || search.brand || search.sort);

  return (
    <div className="mx-auto min-w-0 max-w-7xl px-3 py-6 sm:px-4 sm:py-8">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:justify-between">
        <div className="min-w-0">
          <h1 className="break-words text-[1.75rem] font-black leading-tight tracking-tight sm:text-2xl">
            All products
          </h1>
          <p className="text-sm text-muted-foreground">
            {products.data?.length ?? 0} item{(products.data?.length ?? 0) === 1 ? "" : "s"}
          </p>
        </div>
        {hasFilters ? (
          <Button variant="ghost" size="sm" onClick={() => navigate({ search: {} })}>
            Clear filters
          </Button>
        ) : null}
      </div>

      <div className="mt-5 grid min-w-0 grid-cols-1 gap-3 sm:mt-6 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          value={search.q ?? ""}
          onChange={(e) => update({ q: e.target.value || undefined })}
          placeholder="Search products"
          className="rounded-xl"
          aria-label="Search products"
        />
        <Select
          value={search.category ?? "all"}
          onValueChange={(v) => update({ category: v === "all" ? undefined : v })}
        >
          <SelectTrigger className="rounded-xl">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {(categories ?? []).map((c) => (
              <SelectItem key={c.id} value={c.slug ?? c.id}>
                {c.parent_id
                  ? `${categoryNames.get(c.parent_id) ?? "Category"} / ${c.name}`
                  : c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={search.brand ?? "all"}
          onValueChange={(v) => update({ brand: v === "all" ? undefined : v })}
        >
          <SelectTrigger className="rounded-xl">
            <SelectValue placeholder="Brand" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All brands</SelectItem>
            {(brands ?? []).map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={search.sort ?? "newest"}
          onValueChange={(v) => update({ sort: v as ProductSearch["sort"] })}
        >
          <SelectTrigger className="rounded-xl">
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="price-asc">Price: low to high</SelectItem>
            <SelectItem value="price-desc">Price: high to low</SelectItem>
            <SelectItem value="name">Name A–Z</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <StoreConfidenceStrip compact />

      <div className="mt-8">
        {products.isLoading ? (
          <div className="grid min-w-0 grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-3xl" />
            ))}
          </div>
        ) : products.data?.length ? (
          <div className="grid min-w-0 grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {products.data.map((p) => (
              <ProductCard key={p.id} product={p} currency={currency} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed p-8 text-center sm:p-12">
            <p className="text-sm font-medium">No products match your filters</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try a different search, or{" "}
              <Link to="/shop/products" search={{}} className="text-primary hover:underline">
                browse everything
              </Link>
              .
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
