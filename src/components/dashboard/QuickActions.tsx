import { Link } from "@tanstack/react-router";
import {
  Receipt,
  UserPlus,
  CalendarPlus,
  Plus,
  Target,
  Wallet,
  FileText,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const actions = [
  {
    title: "Add Transaction",
    icon: Receipt,
    to: "/money-center",
    color: "bg-alexos-blue/12 text-alexos-blue ring-alexos-blue/20",
  },
  {
    title: "New Customer",
    icon: UserPlus,
    to: "/people",
    color: "bg-success/12 text-success ring-success/20",
  },
  {
    title: "Create Task",
    icon: Plus,
    to: "/tasks",
    color: "bg-alexos-purple/12 text-alexos-purple ring-alexos-purple/20",
  },
  {
    title: "Schedule",
    icon: CalendarPlus,
    to: "/calendar",
    color: "bg-alexos-coral/12 text-alexos-coral ring-alexos-coral/20",
  },
  {
    title: "Goals",
    icon: Target,
    to: "/goals",
    color: "bg-alexos-amber/12 text-alexos-amber ring-alexos-amber/20",
  },
  {
    title: "Debt",
    icon: Wallet,
    to: "/debt-management",
    color: "bg-orange-400/12 text-orange-300 ring-orange-300/20",
  },
  {
    title: "Documents",
    icon: FileText,
    to: "/documents",
    color: "bg-slate-400/12 text-slate-300 ring-slate-300/20",
  },
];

export function QuickActions({ compact = false }: { compact?: boolean }) {
  const visibleActions = compact ? actions.slice(0, 5) : actions;

  return (
    <section
      className={`space-y-4 rounded-[1.5rem] border border-border/50 bg-card/35 ${compact ? "p-4" : "p-4 sm:p-5"}`}
    >
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary sm:text-xs">
            Quick actions
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">Move things forward.</h2>
          <p className="text-xs text-muted-foreground sm:text-sm">
            {compact ? "The things you use most." : "The things you use most, one swipe away."}
          </p>
        </div>
        <ChevronRight
          className="mb-1 h-4 w-4 shrink-0 text-muted-foreground sm:hidden"
          aria-hidden="true"
        />
      </div>

      <div
        className={`flex snap-x snap-mandatory gap-2.5 overflow-x-auto pb-2 pr-5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:overflow-visible sm:pb-0 ${compact ? "sm:grid-cols-5" : "sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7"}`}
        aria-label="Quick actions"
      >
        {visibleActions.map((action) => (
          <Link key={action.title} to={action.to} className="min-w-[116px] snap-start sm:min-w-0">
            <Card className="h-full cursor-pointer rounded-2xl border-border/60 bg-card/85 shadow-[0_12px_28px_-22px_var(--alexos-glow)] transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_18px_34px_-22px_var(--alexos-glow)]">
              <CardContent className="flex min-h-[104px] flex-col items-center justify-center gap-2.5 p-3 sm:min-h-[128px] sm:gap-3 sm:p-4">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-2xl ring-1 sm:h-12 sm:w-12 ${action.color}`}
                >
                  <action.icon className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                </div>
                <span className="text-center text-[11px] font-semibold leading-4 sm:text-sm sm:leading-5">
                  {action.title}
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
