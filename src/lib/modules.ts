import {
  LayoutDashboard,
  Building2,
  Car,
  ShoppingBag,
  Gem,
  Users,
  Wallet,
  TrendingDown,
  Landmark,
  Brain,
  Target,
  Megaphone,
  BarChart3,
  BookOpen,
  FileText,
  StickyNote,
  Rocket,
  CheckSquare,
  Calendar,
  Bell,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type ModuleGroup =
  | "Home"
  | "Businesses"
  | "Money"
  | "Auren"
  | "Growth"
  | "Library"
  | "Missions"
  | "Notifications"
  | "System";

export interface ModuleDef {
  title: string;
  url: string;
  icon: LucideIcon;
  description: string;
  group: ModuleGroup;
  /** When set, this module is only visible when the named business is active. */
  businessSlug?: string;
  /** Marks roadmap/placeholder modules that lack live data connections. */
  preview?: boolean;
}

export const modules: ModuleDef[] = [
  // ── Home ─────────────────────────────────────────────
  {
    title: "Home",
    url: "/dashboard",
    icon: LayoutDashboard,
    description: "Command center — priorities, money and business signals.",
    group: "Home",
  },

  // ── Businesses ───────────────────────────────────────
  {
    title: "CarBar Motion",
    url: "/vehicle-sales",
    icon: Car,
    description: "Roadmap preview — vehicle inventory, financing and sales pipeline.",
    group: "Businesses",
    businessSlug: "carbaramotion",
    preview: true,
  },
  {
    title: "DailyGear",
    url: "/e-commerce",
    icon: ShoppingBag,
    description: "Products, inventory, orders and online sales.",
    group: "Businesses",
    businessSlug: "dailygear",
  },
  {
    title: "Novera",
    url: "/businesses/novera",
    icon: Gem,
    description: "Roadmap preview — business operations and growth for Novera.",
    group: "Businesses",
    businessSlug: "novera",
    preview: true,
  },
  {
    title: "People",
    url: "/people",
    icon: Users,
    description: "Customers, contacts, leads and relationship management.",
    group: "Growth",
  },

  // ── Money ────────────────────────────────────────────
  {
    title: "Money Center",
    url: "/money-center",
    icon: Wallet,
    description: "Cash flow, income and expenses across accounts.",
    group: "Money",
  },
  {
    title: "Debt Management",
    url: "/debt-management",
    icon: TrendingDown,
    description: "Liabilities, payoff plans and interest tracking.",
    group: "Money",
  },
  {
    title: "Banking",
    url: "/banking",
    icon: Landmark,
    description: "Banking growth, products, relationships and financing pipeline.",
    group: "Money",
  },

  // ── Auren ────────────────────────────────────────────
  {
    title: "Auren",
    url: "/auren",
    icon: Brain,
    description: "Business signals and recommendations across your operations.",
    group: "Auren",
  },

  // ── Growth ───────────────────────────────────────────
  {
    title: "Goals",
    url: "/goals",
    icon: Target,
    description: "Personal, business and financial goals.",
    group: "Growth",
  },
  {
    title: "Marketing",
    url: "/marketing",
    icon: Megaphone,
    description: "Roadmap preview — campaigns, social media and growth automation.",
    group: "Growth",
    preview: true,
  },
  {
    title: "Reports",
    url: "/reports",
    icon: BarChart3,
    description: "Roadmap preview — KPIs, dashboards and executive reporting.",
    group: "Growth",
    preview: true,
  },

  // ── Library ──────────────────────────────────────────
  {
    title: "Library",
    url: "/library",
    icon: BookOpen,
    description: "Roadmap preview — documents, files, contracts and knowledge base.",
    group: "Library",
    preview: true,
  },
  {
    title: "Documents",
    url: "/documents",
    icon: FileText,
    description: "Roadmap preview — files, contracts and paperwork.",
    group: "Library",
    preview: true,
  },
  {
    title: "Notes",
    url: "/notes",
    icon: StickyNote,
    description: "Roadmap preview — ideas, meeting notes and knowledge.",
    group: "Library",
    preview: true,
  },

  // ── Missions ─────────────────────────────────────────
  {
    title: "Missions",
    url: "/missions",
    icon: Rocket,
    description: "Roadmap preview — strategic priorities and mission execution.",
    group: "Missions",
    preview: true,
  },
  {
    title: "Tasks",
    url: "/tasks",
    icon: CheckSquare,
    description: "Roadmap preview — actions, priorities and daily execution.",
    group: "Missions",
    preview: true,
  },
  {
    title: "Calendar",
    url: "/calendar",
    icon: Calendar,
    description: "Roadmap preview — meetings, events and schedule.",
    group: "Missions",
    preview: true,
  },

  // ── Notifications ────────────────────────────────────
  {
    title: "Notifications",
    url: "/notifications",
    icon: Bell,
    description: "Live signals; delivery history and preferences are roadmap items.",
    group: "Notifications",
  },

  // ── System ───────────────────────────────────────────
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
    description: "Workspace, profile and preferences.",
    group: "System",
  },
];

export const moduleGroups: ModuleGroup[] = [
  "Home",
  "Businesses",
  "Money",
  "Auren",
  "Growth",
  "Library",
  "Missions",
  "Notifications",
  "System",
];

/** Five items pinned to the mobile bottom navigation bar. */
export const bottomNavItems = [
  { title: "Home", url: "/dashboard", icon: LayoutDashboard },
  { title: "Businesses", url: "/businesses", icon: Building2 },
  { title: "Auren", url: "/auren", icon: Brain },
  { title: "Money", url: "/money-center", icon: Wallet },
  { title: "Library", url: "/library", icon: BookOpen },
] as const;

/**
 * Returns all core modules (Home, Money, Auren, Growth, Library, Missions, etc.)
 * plus business-scoped modules for the active business.
 * When no business is active, returns only core modules.
 */
export function getModulesForBusiness(businessSlug: string | null): ModuleDef[] {
  return modules.filter((m) => !m.businessSlug || m.businessSlug === businessSlug);
}

/** Returns only the business-scoped modules for the given business. */
export function getBusinessModules(businessSlug: string | null): ModuleDef[] {
  if (!businessSlug) return modules.filter((m) => m.group === "Businesses");
  return modules.filter((m) => m.businessSlug === businessSlug);
}
