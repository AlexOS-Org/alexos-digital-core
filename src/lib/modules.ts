import {
  LayoutDashboard,
  Users,
  Wallet,
  Landmark,
  Car,
  ShoppingBag,
  Megaphone,
  Target,
  TrendingDown,
  CheckSquare,
  Calendar,
  BarChart3,
  FileText,
  StickyNote,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface ModuleDef {
  title: string;
  url: string;
  icon: LucideIcon;
  description: string;
  group: "Overview" | "Operations" | "Growth" | "Productivity" | "System";
}

export const modules: ModuleDef[] = [
  {
    title: "Command Center",
    url: "/dashboard",
    icon: LayoutDashboard,
    description: "Executive overview and key performance indicators.",
    group: "Overview",
  },
  {
    title: "People",
    url: "/people",
    icon: Users,
    description: " CRM for customers, prospects, leads, follow-ups and relationships.",
    group: "Operations",
  },
  {
    title: "Money Center",
    url: "/money-center",
    icon: Wallet,
    description: "Cash flow, income and expenses across accounts.",
    group: "Operations",
  },
  {
    title: "Banking",
    url: "/banking",
    icon: Landmark,
    description:
      "Sales pipeline, customer onboarding, loans, deposits and relationship management.",
    group: "Operations",
  },
  {
    title: "Vehicle Sales",
    url: "/vehicle-sales",
    icon: Car,
    description: "Manage inventory, customers, quotations, financing and vehicle sales.",
    group: "Operations",
  },
  {
    title: "E-Commerce",
    url: "/e-commerce",
    icon: ShoppingBag,
    description: "Products, inventory, orders, suppliers, customers and online sales.",
    group: "Growth",
  },
  {
    title: "Marketing",
    url: "/marketing",
    icon: Megaphone,
    description: "Campaigns, social media, copywriting, ads and AI marketing automation.",
    group: "Growth",
  },
  {
    title: "Goals",
    url: "/goals",
    icon: Target,
    description: "Personal, business and financial goals with intelligent progress tracking.",
    group: "Growth",
  },
  {
    title: "Debt Management",
    url: "/debt-management",
    icon: TrendingDown,
    description: "Liabilities, payoff plans and interest tracking.",
    group: "Operations",
  },
  {
    title: "Tasks",
    url: "/tasks",
    icon: CheckSquare,
    description: "Actions, priorities and daily execution.",
    group: "Productivity",
  },
  {
    title: "Calendar",
    url: "/calendar",
    icon: Calendar,
    description: "Meetings, events and schedule.",
    group: "Productivity",
  },
  {
    title: "Reports",
    url: "/reports",
    icon: BarChart3,
    description: "Business intelligence, dashboards, KPIs and executive reporting.",
    group: "Growth",
  },
  {
    title: "Documents",
    url: "/documents",
    icon: FileText,
    description: "Files, contracts and paperwork.",
    group: "Productivity",
  },
  {
    title: "Notes",
    url: "/notes",
    icon: StickyNote,
    description: "Ideas, meeting notes and knowledge base.",
    group: "Productivity",
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
    description: "Workspace, profile and preferences.",
    group: "System",
  },
];

export const moduleGroups = ["Overview", "Operations", "Growth", "Productivity", "System"] as const;
