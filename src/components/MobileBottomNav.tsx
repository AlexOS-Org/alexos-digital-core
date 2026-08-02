import { Link, useRouterState } from "@tanstack/react-router";
import { useIsMobile } from "@/hooks/use-mobile";
import { bottomNavItems } from "@/lib/modules";
import { cn } from "@/lib/utils";

export function MobileBottomNav() {
  const isMobile = useIsMobile();
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  if (!isMobile) return null;

  const isActive = (url: string) =>
    pathname === url || (url !== "/dashboard" && pathname.startsWith(url));

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-md md:hidden safe-area-inset-bottom"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around px-1 py-1.5">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.url);
          return (
            <Link
              key={item.url}
              to={item.url}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl px-3 py-2 min-w-0 flex-1 transition-colors",
                active ? "text-primary" : "text-muted-foreground",
              )}
              aria-current={active ? "page" : undefined}
            >
              <div
                className={cn("flex h-6 w-6 items-center justify-center", active && "text-primary")}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium truncate",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                {item.title}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
