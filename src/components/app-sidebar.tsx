import { useState } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { modules, moduleGroups } from "@/lib/modules";
import { DAILYGEAR_SECTIONS } from "@/lib/dailygear/registry";
import { MONEY_CENTER_SECTIONS } from "@/lib/money/registry";
import { AlexOSLogo } from "@/components/alexos-logo";
import { DailyGearBrand } from "@/components/dailygear/DailyGearBrand";
import { Building2, ChevronRight, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const BUSINESS_GROUP = "Businesses" as const;
const MoneyCenterIcon = MONEY_CENTER_SECTIONS[0].icon;

export function AppSidebar() {
  const { state, setOpenMobile } = useSidebar();
  const [hoverExpanded, setHoverExpanded] = useState(false);
  const collapsed = state === "collapsed" && !hoverExpanded;
  const [businessesOpen, setBusinessesOpen] = useState(true);
  const [moneyCenterOpen, setMoneyCenterOpen] = useState(true);

  const currentPath = useRouterState({
    select: (r) => r.location.pathname,
  });
  const isDailyGearRoute = currentPath.startsWith("/e-commerce");
  const isMoneyCenterRoute = currentPath.startsWith("/money-center");

  const navigate = useNavigate();

  const isActive = (path: string) =>
    currentPath === path || (path !== "/dashboard" && currentPath.startsWith(path + "/"));

  const closeSidebar = () => setOpenMobile(false);

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/auth", replace: true });
    closeSidebar();
  };

  const businessModules = modules.filter((m) => m.group === BUSINESS_GROUP);
  const isBusinessActive = businessModules.some((m) => isActive(m.url));

  // Groups rendered in the scrollable content area (excluding Home and System)
  const contentGroups = moduleGroups.filter(
    (g) => g !== "Home" && g !== BUSINESS_GROUP && g !== "System",
  );

  return (
    <Sidebar
      collapsible="icon"
      className="alexos-sidebar-sheen border-r border-sidebar-border transition-shadow duration-200 group-data-[collapsible=icon]:shadow-lg group-data-[collapsible=icon]:shadow-black/10"
      onMouseEnter={() => setHoverExpanded(true)}
      onMouseLeave={() => setHoverExpanded(false)}
      onFocusCapture={() => setHoverExpanded(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setHoverExpanded(false);
        }
      }}
    >
      <SidebarHeader className="border-b border-sidebar-border/70 bg-sidebar/80">
        <Link
          to="/dashboard"
          onClick={closeSidebar}
          className="flex min-w-0 items-center gap-2 px-2 py-2 text-sidebar-foreground"
          aria-label="Open AlexOS dashboard"
        >
          <AlexOSLogo compact showWordmark={!collapsed} />
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {/* ── Home ──────────────────────────────────── */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {modules
                .filter((m) => m.group === "Home")
                .map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.url)}
                      tooltip={item.title}
                      className="data-[active=true]:alexos-nav-active"
                    >
                      <Link to={item.url} onClick={closeSidebar}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* ── Businesses (collapsible) ───────────────── */}
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel>Businesses</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {collapsed ? (
                // Collapsed: show each business icon individually with tooltip
                businessModules.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.url)}
                      tooltip={item.title}
                      className="data-[active=true]:alexos-nav-active"
                    >
                      <Link to={item.url} onClick={closeSidebar}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              ) : (
                // Expanded: collapsible parent + sub-items
                <Collapsible
                  open={businessesOpen}
                  onOpenChange={setBusinessesOpen}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        isActive={isBusinessActive && !businessesOpen}
                        tooltip="Businesses"
                      >
                        <Building2 className="h-4 w-4" />
                        <span>Businesses</span>
                        <ChevronRight className="ml-auto h-3.5 w-3.5 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                  </SidebarMenuItem>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {businessModules.map((item) => (
                        <SidebarMenuSubItem key={item.url}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={isActive(item.url)}
                            className="data-[active=true]:alexos-nav-active"
                          >
                            <Link to={item.url} onClick={closeSidebar}>
                              <item.icon className="h-3.5 w-3.5" />
                              <span>{item.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* ── DailyGear contextual workspace ─────────── */}
        {currentPath.startsWith("/e-commerce") ? (
          <SidebarGroup>
            <div className="px-2 pb-2">
              {collapsed ? (
                <div
                  className="grid h-9 w-9 place-items-center rounded-xl bg-red-500 text-xs font-black text-white shadow-lg shadow-red-500/20"
                  aria-label="DailyGear workspace"
                  title="DailyGear workspace"
                >
                  DG
                </div>
              ) : (
                <div className="rounded-2xl border border-sidebar-border/70 bg-sidebar-accent/40 px-3 py-2.5">
                  <DailyGearBrand compact tone="sidebar" />
                </div>
              )}
            </div>
            {!collapsed && (
              <SidebarGroupLabel className="text-sidebar-foreground/55">
                DailyGear workspace
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {DAILYGEAR_SECTIONS.map((section) => (
                  <SidebarMenuItem key={section.to}>
                    <SidebarMenuButton
                      asChild
                      isActive={section.exact ? currentPath === section.to : isActive(section.to)}
                      tooltip={section.label}
                      className="data-[active=true]:alexos-nav-active"
                    >
                      <Link to={section.to} onClick={closeSidebar}>
                        <section.icon className="h-4 w-4" />
                        <span>{section.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}

        {/* ── Money Center contextual workspace ───────── */}
        {isMoneyCenterRoute ? (
          <SidebarGroup>
            <div className="px-2 pb-2">
              {collapsed ? (
                <div
                  className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-xs font-black text-primary-foreground shadow-lg shadow-primary/20"
                  aria-label="Money Center workspace"
                  title="Money Center workspace"
                >
                  MC
                </div>
              ) : (
                <div className="rounded-2xl border border-sidebar-border/70 bg-sidebar-accent/40 px-3 py-2.5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-sidebar-foreground">
                    <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/15 text-primary">
                      <MoneyCenterIcon className="h-4 w-4" />
                    </span>
                    <span>Money Center</span>
                  </div>
                  <p className="mt-1 pl-9 text-[11px] text-sidebar-foreground/55">
                    Personal and business money
                  </p>
                </div>
              )}
            </div>
            {!collapsed && (
              <SidebarGroupLabel className="text-sidebar-foreground/55">
                Money Center workspace
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {collapsed ? (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive("/money-center")}
                      tooltip="Money Center"
                      className="data-[active=true]:alexos-nav-active"
                    >
                      <Link to="/money-center" onClick={closeSidebar}>
                        <MoneyCenterIcon className="h-4 w-4" />
                        <span>Money Center</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ) : (
                  <Collapsible
                    open={moneyCenterOpen}
                    onOpenChange={setMoneyCenterOpen}
                    className="group/collapsible"
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton isActive={!moneyCenterOpen} tooltip="Money Center">
                          <MoneyCenterIcon className="h-4 w-4" />
                          <span>Sections</span>
                          <ChevronRight className="ml-auto h-3.5 w-3.5 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                    </SidebarMenuItem>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {MONEY_CENTER_SECTIONS.map((section) => (
                          <SidebarMenuSubItem key={section.to}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={
                                section.exact ? currentPath === section.to : isActive(section.to)
                              }
                              className="data-[active=true]:alexos-nav-active"
                            >
                              <Link to={section.to} onClick={closeSidebar}>
                                <section.icon className="h-3.5 w-3.5" />
                                <span>{section.label}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}

        {/* ── Remaining groups ──────────────────────── */}
        {contentGroups.map((group) => {
          const items = modules.filter((m) => m.group === group);
          if (!items.length) return null;
          return (
            <SidebarGroup key={group}>
              {!collapsed && <SidebarGroupLabel>{group}</SidebarGroupLabel>}
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((item) => (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive(item.url)}
                        tooltip={item.title}
                        className="data-[active=true]:alexos-nav-active"
                      >
                        <Link to={item.url} onClick={closeSidebar}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      {/* ── Footer: Settings + Sign out ───────────── */}
      <SidebarFooter className="border-t border-sidebar-border/70 bg-sidebar/70">
        <SidebarMenu>
          {modules
            .filter((m) => m.group === "System")
            .map((item) => (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive(item.url)}
                  tooltip={item.title}
                  className="data-[active=true]:alexos-nav-active"
                >
                  <Link to={item.url} onClick={closeSidebar}>
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          <SidebarMenuItem>
            <SidebarMenuButton onClick={signOut} tooltip="Sign out">
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
