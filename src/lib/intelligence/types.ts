import type { LucideIcon } from "lucide-react";

export type SignalCategory = "money" | "crm" | "business" | "goals";
export type SignalPriority = "critical" | "high" | "medium" | "low";

export interface IntelligenceSignal {
  id: string;
  category: SignalCategory;
  categoryLabel: string;
  title: string;
  description: string;
  recommendation: string;
  priority: SignalPriority;
  timestamp: string;
  icon: LucideIcon;
  action?: { label: string; to: string };
}

export interface Priority {
  id: string;
  title: string;
  detail: string;
  count: number;
  tone: "amber" | "blue" | "violet" | "emerald";
  to: string;
}
