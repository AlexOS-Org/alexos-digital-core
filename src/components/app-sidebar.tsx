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
import { AlexOSLogo } from "@/components/alexos-logo";
import { Building2, ChevronRight, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const BUSINESS_GROUP = "Businesses" as const;

export function AppSidebar() {
  const { state, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const [businessesOpen, setBusinessesOpen] = useState(true);

  const currentPath = useRouterState({
    select: (r) => r.location.pathname,
  });

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
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border">
        <Link
          to="/dashboard"
          onClick={closeSidebar}
          className="flex items-center gap-2 px-2 py-2 text-sidebar-foreground"
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
                    <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
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
                    <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
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
                          <SidebarMenuSubButton asChild isActive={isActive(item.url)}>
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
                      <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
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
      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          {modules
            .filter((m) => m.group === "System")
            .map((item) => (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
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
