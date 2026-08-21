import { Bell, ShoppingBag, Sparkles } from "lucide-react";
import { createFileRoute, Link, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { SupabaseConfigBanner } from "@/components/SupabaseConfigBanner";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { modules } from "@/lib/modules";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    // When the Supabase credentials are not configured for the deployment,
    // the app shell must still render rather than crashing on mobile/desktop.
    // Treat the user as a guest so pages load and show the configuration banner.
    if (!isSupabaseConfigured()) return { user: null };
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthenticatedLayout,
});

function MobileWorkspaceHeader({
  isDailyGearRoute,
  currentTitle,
}: {
  isDailyGearRoute: boolean;
  currentTitle?: string;
}) {
  const Icon = isDailyGearRoute ? ShoppingBag : Sparkles;
  const title = isDailyGearRoute ? "DailyGear" : currentTitle === "Dashboard" ? "Auren" : "AlexOS";
  const subtitle = isDailyGearRoute
    ? "Sell more. Grow daily."
    : title === "Auren"
      ? "AI assistant"
      : "Business OS";
  return (
    <header className="sticky top-0 z-20 flex h-[4.5rem] items-center gap-3 border-b border-border/60 bg-background/90 px-4 backdrop-blur-xl md:hidden">
      <SidebarTrigger className="tap-target rounded-xl" />
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--alexos-purple)] to-[var(--alexos-blue)] text-white shadow-lg shadow-[var(--alexos-glow)]">
          <Icon className="h-[18px] w-[18px]" />
        </div>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-bold tracking-tight">{title}</p>
          <p className="truncate text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {subtitle}
          </p>
        </div>
      </div>
      <Link
        to="/notifications"
        className="tap-target grid place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Notifications"
      >
        <Bell className="h-[19px] w-[19px]" />
      </Link>
      <Link
        to="/settings"
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[var(--alexos-blue)] to-[var(--alexos-purple)] text-[11px] font-bold text-white shadow-md"
        aria-label="Open settings"
      >
        AO
      </Link>
    </header>
  );
}

function AuthenticatedLayout() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const isDailyGearRoute = pathname.startsWith("/e-commerce");

  // Match the deepest module whose URL is a prefix of the current path
  const current = modules.find(
    (m) =>
      m.url === pathname ||
      (m.url !== "/dashboard" && pathname.startsWith(m.url + "/")) ||
      (m.url !== "/dashboard" && pathname.startsWith(m.url)),
  );
  const businessContext = pathname.startsWith("/e-commerce")
    ? "DailyGear"
    : pathname.startsWith("/vehicle-sales")
      ? "Car-Bar Motion.ke"
      : pathname.startsWith("/businesses")
        ? "Novera"
        : null;
  const breadcrumb = ["AlexOS", businessContext, current?.title].filter(
    (label, index, labels): label is string => Boolean(label) && labels.indexOf(label) === index,
  );

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background text-foreground transition-colors duration-300">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-20 hidden h-16 items-center gap-3 border-b border-border/70 bg-background/80 px-4 backdrop-blur-xl sm:px-6 md:flex">
            <SidebarTrigger className="tap-target rounded-xl" />
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
                {current?.group ?? "Workspace"}
              </div>
              <div className="text-sm font-semibold truncate">{current?.title ?? "AlexOS"}</div>
              <div className="hidden items-center gap-1 text-[10px] text-muted-foreground sm:flex">
                {breadcrumb.map((label, index) => (
                  <span key={`${label}-${index}`}>
                    {index > 0 && <span className="mr-1 text-muted-foreground/50">/</span>}
                    {label}
                  </span>
                ))}
              </div>
            </div>
            <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
              <span className="hidden sm:inline">Settings control appearance</span>
              <Link
                to="/settings"
                className="rounded-lg px-2 py-1.5 font-medium text-primary hover:bg-primary/10"
              >
                Settings
              </Link>
            </div>
          </header>
          <MobileWorkspaceHeader
            isDailyGearRoute={isDailyGearRoute}
            currentTitle={current?.title}
          />
          {/* Extra bottom padding on mobile so content clears the bottom nav */}
          <SupabaseConfigBanner />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 md:pb-8">
            <Outlet />
          </main>
          {!isDailyGearRoute && <MobileBottomNav />}
        </div>
      </div>
    </SidebarProvider>
  );
}
