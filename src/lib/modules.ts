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
    description: "Vehicle inventory, financing and sales pipeline.",
    group: "Businesses",
  },
  {
    title: "DailyGear",
    url: "/e-commerce",
    icon: ShoppingBag,
    description: "Products, inventory, orders and online sales.",
    group: "Businesses",
  },
  {
    title: "Nuvora",
    url: "/businesses/novera",
    icon: Gem,
    description: "Business operations and growth for Nuvora.",
    group: "Businesses",
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
    description: "Loans, deposits and banking relationships.",
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
    description: "Campaigns, social media and growth automation.",
    group: "Growth",
  },
  {
    title: "Reports",
    url: "/reports",
    icon: BarChart3,
    description: "KPIs, dashboards and executive reporting.",
    group: "Growth",
  },

  // ── Library ──────────────────────────────────────────
  {
    title: "Library",
    url: "/library",
    icon: BookOpen,
    description: "Documents, files, contracts and knowledge base.",
    group: "Library",
  },
  {
    title: "Documents",
    url: "/documents",
    icon: FileText,
    description: "Files, contracts and paperwork.",
    group: "Library",
  },
  {
    title: "Notes",
    url: "/notes",
    icon: StickyNote,
    description: "Ideas, meeting notes and knowledge.",
    group: "Library",
  },

  // ── Missions ─────────────────────────────────────────
  {
    title: "Missions",
    url: "/missions",
    icon: Rocket,
    description: "Strategic priorities and mission execution.",
    group: "Missions",
  },
  {
    title: "Tasks",
    url: "/tasks",
    icon: CheckSquare,
    description: "Actions, priorities and daily execution.",
    group: "Missions",
  },
  {
    title: "Calendar",
    url: "/calendar",
    icon: Calendar,
    description: "Meetings, events and schedule.",
    group: "Missions",
  },

  // ── Notifications ────────────────────────────────────
  {
    title: "Notifications",
    url: "/notifications",
    icon: Bell,
    description: "Alerts, updates and system signals.",
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
