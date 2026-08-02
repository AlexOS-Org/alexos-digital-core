import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Boxes,
  Radar,
  Swords,
  Megaphone,
  LayoutTemplate,
  Sparkles,
  BarChart3,
  Settings,
  type LucideIcon,
} from "lucide-react";

/**
 * The single source of truth for DailyGear navigation.
 *
 * Sub-navigation, mobile menus and any future command palette read from this
 * list — adding, removing or reordering a section is a one-line change here
 * plus the route file. Nothing else hardcodes the layout.
 */
export interface DailyGearSection {
  /** Route path. */
  to: string;
  label: string;
  icon: LucideIcon;
  description: string;
  group: "Operations" | "Intelligence" | "Growth" | "System";
  exact?: boolean;
  /** Marks surfaces whose data sources are not yet connected. */
  preview?: boolean;
}

export const DAILYGEAR_SECTIONS: DailyGearSection[] = [
  {
    to: "/e-commerce",
    label: "Overview",
    icon: LayoutDashboard,
    description: "Executive KPIs, revenue trends and operating signals.",
    group: "Operations",
    exact: true,
  },
  {
    to: "/e-commerce/products",
    label: "Products",
    icon: Package,
    description: "Catalogue, pricing, variants, suppliers and attributes.",
    group: "Operations",
  },
  {
    to: "/e-commerce/orders",
    label: "Orders",
    icon: ShoppingCart,
    description: "Fulfilment pipeline, payments, shipping and timelines.",
    group: "Operations",
  },
  {
    to: "/e-commerce/customers",
    label: "Customers",
    icon: Users,
    description: "Purchase history, lifetime value and segmentation.",
    group: "Operations",
  },
  {
    to: "/e-commerce/inventory",
    label: "Inventory",
    icon: Boxes,
    description: "Stock levels, movements, reorder and dead-stock signals.",
    group: "Operations",
  },
  {
    to: "/e-commerce/market",
    label: "Market",
    icon: Radar,
    description: "Demand, category trends and seasonal opportunity.",
    group: "Intelligence",
    preview: true,
  },
  {
    to: "/e-commerce/competitors",
    label: "Competitors",
    icon: Swords,
    description: "Pricing, assortment and promotion monitoring.",
    group: "Intelligence",
    preview: true,
  },
  {
    to: "/e-commerce/marketing",
    label: "Marketing",
    icon: Megaphone,
    description: "Channel performance, ROAS, CTR, CPC and CPA.",
    group: "Growth",
    preview: true,
  },
  {
    to: "/e-commerce/landing-pages",
    label: "Landing Pages",
    icon: LayoutTemplate,
    description: "Generated product pages, copy blocks and SEO metadata.",
    group: "Growth",
    preview: true,
  },
  {
    to: "/e-commerce/ads",
    label: "Ad Studio",
    icon: Sparkles,
    description: "Ad variants, creatives, audiences and budget guidance.",
    group: "Growth",
    preview: true,
  },
  {
    to: "/e-commerce/reports",
    label: "Reports",
    icon: BarChart3,
    description: "Filterable sales, profit, product and customer reporting.",
    group: "Growth",
  },
  {
    to: "/e-commerce/settings",
    label: "Settings",
    icon: Settings,
    description: "Business, tax, shipping, currency and integrations.",
    group: "System",
  },
];

export function findSection(path: string) {
  return (
    DAILYGEAR_SECTIONS.find((s) => (s.exact ? s.to === path : path.startsWith(s.to))) ??
    DAILYGEAR_SECTIONS[0]
  );
}
