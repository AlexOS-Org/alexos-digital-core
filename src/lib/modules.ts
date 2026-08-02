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
  | "Intelligence"
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
  // Home
  {
    title: "Command Center",
    url: "/dashboard",
    icon: LayoutDashboard,
    description: "Your AlexOS Command Center with priorities, money and business signals.",
    group: "Home",
  },

  // Businesses
  {
    title: "CarBar Motion",
    url: "/vehicle-sales",
    icon: Car,
    description: "Vehicle inventory, financing, quotations and customer management.",
    group: "Businesses",
  },
  {
    title: "DailyGear",
    url: "/e-commerce",
    icon: ShoppingBag,
    description: "Products, inventory, suppliers, customers and online orders.",
    group: "Businesses",
  },
  {
    title: "Nuvora",
    url: "/businesses",
    icon: Gem,
    description: "Business operations, administration and growth management.",
    group: "Businesses",
  },
  {
    title: "People",
    url: "/people",
    icon: Users,
    description: "CRM for customers, prospects, leads and relationship management.",
    group: "Businesses",
  },

  // Money
  {
    title: "Money Center",
    url: "/money-center",
    icon: Wallet,
    description: "Cash flow, income, expenses, budgets and financial performance.",
    group: "Money",
  },
  {
    title: "Debt Management",
    url: "/debt-management",
    icon: TrendingDown,
    description: "Loans, liabilities and repayment tracking.",
    group: "Money",
  },
  {
    title: "Banking",
    url: "/banking",
    icon: Landmark,
    description: "Bank accounts, deposits, loans and financial relationships.",
    group: "Money",
  },

  // Intelligence
  {
    title: "Auren",
    url: "/auren",
    icon: Brain,
    description: "Business intelligence, insights and recommendations across AlexOS.",
    group: "Intelligence",
  },

  // Growth
  {
    title: "Goals",
    url: "/goals",
    icon: Target,
    description: "Personal, business and financial goals with progress tracking.",
    group: "Growth",
  },
  {
    title: "Marketing",
    url: "/marketing",
    icon: Megaphone,
    description: "Campaigns, content, social media and growth automation.",
    group: "Growth",
  },
  {
    title: "Reports",
    url: "/reports",
    icon: BarChart3,
    description: "Business intelligence dashboards, KPIs and executive reporting.",
    group: "Growth",
  },

  // Library
  {
    title: "Library",
    url: "/library",
    icon: BookOpen,
    description: "Documents, contracts, files and knowledge base.",
    group: "Library",
  },
  {
    title: "Documents",
    url: "/documents",
    icon: FileText,
    description: "Business documents and contracts.",
    group: "Library",
  },
  {
    title: "Notes",
    url: "/notes",
    icon: StickyNote,
    description: "Ideas, meeting notes and personal knowledge.",
    group: "Library",
  },

  // Missions
  {
    title: "Missions",
    url: "/missions",
    icon: Rocket,
    description: "Strategic priorities and execution.",
    group: "Missions",
  },
  {
    title: "Tasks",
    url: "/tasks",
    icon: CheckSquare,
    description: "Daily tasks and action tracking.",
    group: "Missions",
  },
  {
    title: "Calendar",
    url: "/calendar",
    icon: Calendar,
    description: "Meetings, schedules and events.",
    group: "Missions",
  },

  // Notifications
  {
    title: "Notifications",
    url: "/notifications",
    icon: Bell,
    description: "Alerts and system notifications.",
    group: "Notifications",
  },

  // System
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
    description: "Workspace, preferences and account settings.",
    group: "System",
  },
];

export const moduleGroups: ModuleGroup[] = [
  "Home",
  "Businesses",
  "Money",
  "Intelligence",
  "Growth",
  "Library",
  "Missions",
  "Notifications",
  "System",
];

export const bottomNavItems = [
  {
    title: "Home",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Businesses",
    url: "/businesses",
    icon: Building2,
  },
  {
    title: "Auren",
    url: "/auren",
    icon: Brain,
  },
  {
    title: "Money",
    url: "/money-center",
    icon: Wallet,
  },
  {
    title: "Library",
    url: "/library",
    icon: BookOpen,
  },
] as const;
