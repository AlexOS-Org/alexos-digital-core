import { createFileRoute, Outlet } from "@tanstack/react-router";
import { StoreHeader } from "@/components/storefront/StoreHeader";
import { StoreFooter } from "@/components/storefront/StoreFooter";
import { useStoreCategories, useStorefront } from "@/lib/storefront/api";

export const Route = createFileRoute("/shop")({
  component: ShopLayout,
});

function ShopLayout() {
  const { data: store } = useStorefront();
  const { data: categories } = useStoreCategories(store?.user_id);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <StoreHeader store={store ?? null} categories={categories ?? []} />
      <main className="flex-1">
        <Outlet />
      </main>
      <StoreFooter store={store ?? null} />
    </div>
  );
}
