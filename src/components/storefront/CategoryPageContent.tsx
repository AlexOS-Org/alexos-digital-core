import { Link } from "@tanstack/react-router";
import { ChevronRight, FolderOpen } from "lucide-react";
import { ProductCard } from "@/components/storefront/ProductCard";
import { StoreConfidenceStrip } from "@/components/storefront/StoreConfidenceStrip";
import {
  useStoreCategories,
  useStoreProducts,
  useStorefront,
  type StoreCategory,
} from "@/lib/storefront/api";
import { useMemo } from "react";

function childrenOf(categories: StoreCategory[], parentId: string | null) {
  return categories
    .filter((category) => category.parent_id === parentId)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
}

function descendantIds(categories: StoreCategory[], rootId: string) {
  const ids = new Set<string>([rootId]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const category of categories) {
      if (category.parent_id && ids.has(category.parent_id) && !ids.has(category.id)) {
        ids.add(category.id);
        changed = true;
      }
    }
  }
  return Array.from(ids);
}

export function CategoryPageContent({
  slug,
  subcategorySlug,
}: {
  slug: string;
  subcategorySlug?: string;
}) {
  const { data: store } = useStorefront();
  const { data: categories = [], isLoading: categoriesLoading } = useStoreCategories(
    store?.user_id,
  );
  const rootCategory = categories.find(
    (category) => category.slug === slug && category.parent_id === null,
  );
  const childCategory = rootCategory
    ? categories.find(
        (category) => category.slug === subcategorySlug && category.parent_id === rootCategory.id,
      )
    : undefined;
  const selectedCategory = childCategory ?? rootCategory;
  const categoryIds = useMemo(
    () => (selectedCategory ? descendantIds(categories, selectedCategory.id) : []),
    [categories, selectedCategory],
  );
  const productFilters = useMemo(() => ({ categoryIds, sort: "newest" as const }), [categoryIds]);
  const products = useStoreProducts(store?.user_id, productFilters);
  const subcategories = rootCategory ? childrenOf(categories, rootCategory.id) : [];
  const currency = store?.currency ?? "KES";

  if (!categoriesLoading && (!rootCategory || (subcategorySlug && !childCategory))) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <FolderOpen className="mx-auto h-10 w-10 text-muted-foreground" />
        <h1 className="mt-4 text-2xl font-black">Category unavailable</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This DailyGear category is not available or has not been published yet.
        </p>
        <Link
          to="/shop/products"
          search={{}}
          className="mt-5 inline-block text-sm font-semibold text-primary hover:underline"
        >
          Browse all products
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <nav
        className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground"
        aria-label="Breadcrumb"
      >
        <Link to="/shop" className="hover:text-foreground">
          DailyGear
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link to="/shop/products" search={{}} className="hover:text-foreground">
          Shop
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        {rootCategory ? (
          <Link
            to="/shop/category/$slug"
            params={{ slug: rootCategory.slug ?? slug }}
            className={childCategory ? "hover:text-foreground" : "font-semibold text-foreground"}
          >
            {rootCategory.name}
          </Link>
        ) : null}
        {childCategory ? (
          <>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="font-semibold text-foreground">{childCategory.name}</span>
          </>
        ) : null}
      </nav>

      <header className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
            DailyGear shop
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">{selectedCategory?.name}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {selectedCategory?.description ??
              "Browse verified DailyGear products in this category."}
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          {products.data?.length ?? 0} product{(products.data?.length ?? 0) === 1 ? "" : "s"}
        </p>
      </header>

      {subcategories.length ? (
        <section className="mt-6 rounded-3xl border bg-card p-4">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
            Shop by subcategory
          </p>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {subcategories.map((subcategory) => (
              <Link
                key={subcategory.id}
                to="/shop/category/$slug/$subcategory"
                params={{
                  slug: rootCategory?.slug ?? slug,
                  subcategory: subcategory.slug ?? subcategory.id,
                }}
                className={`whitespace-nowrap rounded-full border px-3 py-2 text-xs font-semibold transition hover:border-primary hover:text-primary ${childCategory?.id === subcategory.id ? "border-primary bg-primary/10 text-primary" : ""}`}
              >
                {subcategory.name}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <StoreConfidenceStrip compact />

      <section className="mt-8">
        {products.isLoading || categoriesLoading ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[...Array(8)].map((_, index) => (
              <div key={index} className="h-80 animate-pulse rounded-3xl bg-muted" />
            ))}
          </div>
        ) : products.data?.length ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {products.data.map((product) => (
              <ProductCard key={product.id} product={product} currency={currency} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed p-12 text-center">
            <p className="text-sm font-semibold">No verified products in this category yet.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              DailyGear keeps empty taxonomy categories private from the public catalogue until a
              verified product is ready.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
