import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, Search, ShoppingBag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useCart } from "@/lib/storefront/cart";
import type { Storefront, StoreCategory } from "@/lib/storefront/api";
import { DAILYGEAR_LOGO, DAILYGEAR_NAME } from "@/lib/storefront/brand";

const LINKS = [
  { to: "/shop", label: "Home", exact: true },
  { to: "/shop/products", label: "Shop" },
  { to: "/shop/about", label: "About" },
  { to: "/shop/faq", label: "Help" },
  { to: "/shop/contact", label: "Contact" },
] as const;

export function StoreHeader({
  store,
  categories,
}: {
  store: Storefront | null;
  categories: StoreCategory[];
}) {
  const { count } = useCart();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const topLevelCategories = categories.filter((category) => category.parent_id === null);

  function search(event: React.FormEvent) {
    event.preventDefault();
    navigate({ to: "/shop/products", search: { q: query || undefined } });
    setOpen(false);
  }

  return (
    <header className="dailygear-store-header sticky top-0 z-40 border-b backdrop-blur-xl">
      {store?.announcement ? (
        <div className="dailygear-store-announcement px-4 py-2 text-center text-xs font-semibold">
          {store.announcement}
        </div>
      ) : null}

      <div className="mx-auto grid max-w-7xl grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:gap-6">
        <div className="flex min-w-0 items-center gap-2">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0 lg:hidden" aria-label="Menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-6">
              <nav className="mt-8 flex flex-col gap-1">
                {LINKS.map((l) => (
                  <Link
                    key={l.to}
                    to={l.to}
                    onClick={() => setOpen(false)}
                    className="rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-muted"
                  >
                    {l.label}
                  </Link>
                ))}
                <Link
                  to="/shop/track"
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-muted"
                >
                  Track order
                </Link>
              </nav>
              {topLevelCategories.length ? (
                <div className="mt-6 space-y-1">
                  <p className="px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Categories
                  </p>
                  {topLevelCategories.map((c) => (
                    <Link
                      key={c.id}
                      to="/shop/category/$slug"
                      params={{ slug: c.slug ?? c.id }}
                      onClick={() => setOpen(false)}
                      className="block rounded-xl px-3 py-2 text-sm hover:bg-muted"
                    >
                      {c.name}
                    </Link>
                  ))}
                </div>
              ) : null}
            </SheetContent>
          </Sheet>

          <Link to="/shop" className="flex min-w-0 items-center gap-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5">
              <img
                src={store?.logo_url ?? DAILYGEAR_LOGO}
                alt=""
                aria-hidden="true"
                width={76}
                height={40}
                className="h-full w-full object-contain"
              />
            </span>
            <span className="truncate text-base font-black tracking-tight sm:text-lg">
              {store?.name ?? DAILYGEAR_NAME}
            </span>
          </Link>
        </div>

        <form onSubmit={search} className="hidden min-w-0 lg:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products"
              className="rounded-xl pl-9"
              aria-label="Search products"
            />
          </div>
        </form>

        <div className="flex shrink-0 items-center gap-1">
          <nav className="mr-2 hidden items-center gap-1 lg:flex">
            {LINKS.slice(1, 4).map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                activeProps={{ className: "text-foreground" }}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <Button asChild variant="ghost" size="icon" className="relative" aria-label="Cart">
            <Link to="/shop/cart">
              <ShoppingBag className="h-5 w-5" />
              {count > 0 ? (
                <Badge className="absolute -right-1 -top-1 h-5 min-w-5 justify-center rounded-full px-1 text-[10px]">
                  {count}
                </Badge>
              ) : null}
            </Link>
          </Button>
        </div>
      </div>

      <form onSubmit={search} className="border-t px-4 pb-3 pt-3 lg:hidden">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search DailyGear"
            className="rounded-xl pl-9"
            aria-label="Search DailyGear"
          />
        </div>
      </form>

      {topLevelCategories.length ? (
        <div className="dailygear-store-category-rail hidden border-t lg:block">
          <div className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4 py-2">
            <Link
              to="/shop/products"
              className="whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-primary/10"
            >
              Browse all
            </Link>
            {topLevelCategories.map((c) => (
              <Link
                key={c.id}
                to="/shop/category/$slug"
                params={{ slug: c.slug ?? c.id }}
                className="whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-primary/10 hover:text-foreground"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </header>
  );
}

export function CartBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 bg-muted px-4 py-2 text-xs">
      <span>Free delivery on qualifying orders.</span>
      <button onClick={onDismiss} aria-label="Dismiss">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
