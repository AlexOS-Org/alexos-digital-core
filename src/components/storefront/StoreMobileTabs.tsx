import { Link, useRouterState } from "@tanstack/react-router";
import { Home, LayoutGrid, Search, ShoppingBag, User } from "lucide-react";
import { useCart } from "@/lib/storefront/cart";
import { cn } from "@/lib/utils";

const TABS: Array<{ to: string; label: string; icon: typeof Home; exact?: boolean }> = [
  { to: "/shop", label: "Home", icon: Home, exact: true },
  { to: "/shop/products", label: "Shop", icon: LayoutGrid },
  { to: "/shop/cart", label: "Bag", icon: ShoppingBag },
  { to: "/shop/track", label: "Orders", icon: Search },
  { to: "/shop/contact", label: "Help", icon: User },
];

/** App-style tab bar for the customer storefront on phones. */
export function StoreMobileTabs() {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const { count } = useCart();

  return (
    <nav
      className="safe-bottom fixed bottom-0 left-0 right-0 z-40 border-t border-border/60 glass-panel lg:hidden"
      aria-label="Store navigation"
    >
      <div className="flex items-center justify-around px-1 pt-1.5">
        {TABS.map((t) => {
          const active = t.exact ? path === t.to : path.startsWith(t.to);
          return (
            <Link
              key={t.to}
              to={t.to as never}
              className={cn(
                "tap-target relative flex flex-1 flex-col items-center gap-1 rounded-2xl px-1 py-1.5 transition-colors",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <t.icon className="h-[18px] w-[18px]" />
              {t.to === "/shop/cart" && count > 0 ? (
                <span className="absolute right-4 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                  {count}
                </span>
              ) : null}
              <span className="text-[10px] font-medium">{t.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
