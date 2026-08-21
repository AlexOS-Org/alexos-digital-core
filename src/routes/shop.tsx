import { createFileRoute, Outlet } from "@tanstack/react-router";
import { StoreHeader } from "@/components/storefront/StoreHeader";
import { StoreFooter } from "@/components/storefront/StoreFooter";
import { StoreMobileTabs } from "@/components/storefront/StoreMobileTabs";
import { useStoreCategories, useStoreProducts, useStorefront } from "@/lib/storefront/api";

export const Route = createFileRoute("/shop")({
  component: ShopLayout,
});

function ShopLayout() {
  const { data: store } = useStorefront();
  const { data: categories } = useStoreCategories(store?.user_id);
  const { data: products } = useStoreProducts(store?.user_id, { limit: 250 });
  const categoryById = new Map((categories ?? []).map((category) => [category.id, category]));
  const visibleCategoryIds = new Set(
    (products ?? []).flatMap((product) => {
      const category = product.category_id ? categoryById.get(product.category_id) : undefined;
      return category
        ? [category.id, category.parent_id].filter((id): id is string => Boolean(id))
        : [];
    }),
  );
  const visibleCategories = (categories ?? []).filter(
    (category) => category.parent_id === null && visibleCategoryIds.has(category.id),
  );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <StoreHeader store={store ?? null} categories={visibleCategories} />
      <main className="flex-1 pb-20 lg:pb-0">
        <Outlet />
      </main>
      <StoreFooter store={store ?? null} />
      <StoreMobileTabs />
    </div>
  );
}
