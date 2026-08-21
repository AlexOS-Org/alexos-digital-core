import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  Boxes,
  LayoutDashboard,
  Megaphone,
  MoreHorizontal,
  Package,
  Plus,
  Settings,
  ShoppingCart,
  Users,
  Wallet,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const TABS: Array<{ to: string; label: string; icon: typeof Package; exact?: boolean }> = [
  { to: "/e-commerce", label: "Home", icon: LayoutDashboard, exact: true },
  { to: "/e-commerce/orders", label: "Orders", icon: ShoppingCart },
  { to: "/e-commerce/products", label: "Products", icon: Package },
  { to: "/e-commerce/customers", label: "People", icon: Users },
];

const MORE: Array<{ to: string; label: string; icon: typeof Package }> = [
  { to: "/e-commerce/inventory", label: "Inventory", icon: Boxes },
  { to: "/e-commerce/marketing", label: "Marketing", icon: Megaphone },
  { to: "/e-commerce/reports", label: "Analytics", icon: BarChart3 },
  { to: "/e-commerce/checkout", label: "Checkout", icon: Wallet },
  { to: "/e-commerce/settings", label: "Settings", icon: Settings },
];

/**
 * Dedicated mobile shell for the DailyGear business app: tab bar + floating action.
 * It is the only bottom navigation rendered on authenticated DailyGear routes.
 */
export function BusinessMobileNav() {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const [open, setOpen] = useState(false);

  const active = (to: string, exact?: boolean) => (exact ? path === to : path.startsWith(to));

  return (
    <>
      <Link
        to="/e-commerce/checkout"
        aria-label="New order"
        className="press fixed bottom-20 right-4 z-40 grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 md:hidden"
      >
        <Plus className="h-6 w-6" />
      </Link>

      <nav
        className="safe-bottom fixed bottom-0 left-2 right-2 z-30 rounded-3xl glass-panel soft-shadow md:hidden"
        aria-label="DailyGear navigation"
      >
        <div className="flex items-center justify-around px-1 py-1.5">
          {TABS.map((t) => {
            const on = active(t.to, t.exact);
            return (
              <Link
                key={t.to}
                to={t.to as never}
                className={cn(
                  "tap-target flex flex-1 flex-col items-center gap-1 rounded-2xl px-1 py-1.5 transition-colors",
                  on
                    ? "bg-primary/12 text-primary shadow-sm ring-1 ring-primary/15"
                    : "text-muted-foreground hover:bg-sidebar-accent/50",
                )}
              >
                <t.icon className="h-[18px] w-[18px]" />
                <span className="text-[10px] font-medium">{t.label}</span>
              </Link>
            );
          })}

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              className="tap-target flex flex-1 flex-col items-center gap-1 rounded-2xl px-1 py-1.5 text-muted-foreground hover:bg-sidebar-accent/50"
              aria-label="More sections"
            >
              <MoreHorizontal className="h-[18px] w-[18px]" />
              <span className="text-[10px] font-medium">More</span>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-3xl p-5 pb-8">
              <SheetHeader className="p-0 text-left">
                <SheetTitle className="text-base">DailyGear</SheetTitle>
              </SheetHeader>
              <div className="mt-4 grid grid-cols-3 gap-3">
                {MORE.map((m) => (
                  <Link
                    key={m.to}
                    to={m.to as never}
                    onClick={() => setOpen(false)}
                    className="press flex flex-col items-center gap-2 rounded-2xl border border-border/60 px-2 py-4 text-center"
                  >
                    <m.icon className="h-5 w-5 text-primary" />
                    <span className="text-[11px] font-medium">{m.label}</span>
                  </Link>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </>
  );
}
