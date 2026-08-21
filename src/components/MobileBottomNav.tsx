import { Link, useRouterState } from "@tanstack/react-router";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { LayoutDashboard, MoreHorizontal, ShoppingBag, Users, Wallet } from "lucide-react";

const primaryItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Money", url: "/money-center", icon: Wallet },
  { title: "CRM", url: "/people", icon: Users },
  { title: "DailyGear", url: "/e-commerce", icon: ShoppingBag },
] as const;

export function MobileBottomNav() {
  const isMobile = useIsMobile();
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { setOpenMobile } = useSidebar();

  if (!isMobile) return null;

  const isActive = (url: string) =>
    pathname === url || (url !== "/dashboard" && pathname.startsWith(url));

  return (
    <nav
      className="safe-area-inset-bottom fixed bottom-0 left-0 right-0 z-50 border-t border-border/70 bg-background/90 shadow-[0_-18px_40px_-28px_var(--alexos-glow)] backdrop-blur-xl md:hidden"
      aria-label="Main navigation"
    >
      <div className="mx-auto flex max-w-lg items-center gap-1 px-2 py-1.5">
        {primaryItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.url);
          return (
            <Link
              key={item.url}
              to={item.url}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 transition-all",
                active
                  ? "bg-primary/12 text-primary shadow-sm ring-1 ring-primary/15"
                  : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground",
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-[19px] w-[19px]" />
              <span className="truncate text-[10px] font-semibold">{item.title}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setOpenMobile(true)}
          className="flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 text-muted-foreground transition-all hover:bg-sidebar-accent/50 hover:text-foreground"
          aria-label="Open more AlexOS navigation"
        >
          <MoreHorizontal className="h-[19px] w-[19px]" />
          <span className="text-[10px] font-semibold">More</span>
        </button>
      </div>
    </nav>
  );
}
