import { createFileRoute, Outlet, redirect, useRouterState } from "@tanstack/react-router";
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
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b border-border bg-card/50 backdrop-blur flex items-center gap-3 px-4 sticky top-0 z-10">
            <SidebarTrigger />
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
          </header>
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
