import { Link } from "@tanstack/react-router";
import {
  Receipt,
  UserPlus,
  CalendarPlus,
  Plus,
  Target,
  Wallet,
  FileText,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

const actions = [
  {
    title: "Add Transaction",
    icon: Receipt,
    to: "/money-center",
    color: "bg-blue-100 text-blue-600",
  },
  {
    title: "New Customer",
    icon: UserPlus,
    to: "/people",
    color: "bg-green-100 text-green-600",
  },
  {
    title: "Create Task",
    icon: Plus,
    to: "/tasks",
    color: "bg-purple-100 text-purple-600",
  },
  {
    title: "Schedule",
    icon: CalendarPlus,
    to: "/calendar",
    color: "bg-pink-100 text-pink-600",
  },
  {
    title: "Goals",
    icon: Target,
    to: "/goals",
    color: "bg-orange-100 text-orange-600",
  },
  {
    title: "Debt",
    icon: Wallet,
    to: "/debt-management",
    color: "bg-red-100 text-red-600",
  },
  {
    title: "Documents",
    icon: FileText,
    to: "/documents",
    color: "bg-slate-100 text-slate-700",
  },
];

export function QuickActions() {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Quick Actions</h2>
        <p className="text-sm text-muted-foreground">Frequently used shortcuts across AlexOS.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {actions.map((action) => (
          <Link key={action.title} to={action.to}>
            <Card className="cursor-pointer rounded-2xl transition-all hover:shadow-lg">
              <CardContent className="flex flex-col items-center justify-center gap-4 py-6">
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${action.color}`}>
                  <action.icon className="h-6 w-6" />
                </div>
                <span className="text-center text-sm font-medium">{action.title}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
