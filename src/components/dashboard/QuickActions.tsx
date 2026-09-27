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
    color: "dashboard-tone-blue dashboard-tone-icon",
  },
  {
    title: "New Customer",
    icon: UserPlus,
    to: "/people",
    color: "dashboard-tone-success dashboard-tone-icon",
  },
  {
    title: "Create Task",
    icon: Plus,
    to: "/tasks",
    color: "dashboard-tone-purple dashboard-tone-icon",
  },
  {
    title: "Schedule",
    icon: CalendarPlus,
    to: "/calendar",
    color: "dashboard-tone-coral dashboard-tone-icon",
  },
  {
    title: "Goals",
    icon: Target,
    to: "/goals",
    color: "dashboard-tone-amber dashboard-tone-icon",
  },
  {
    title: "Debt",
    icon: Wallet,
    to: "/debt-management",
    color: "dashboard-tone-amber dashboard-tone-icon",
  },
  {
    title: "Documents",
    icon: FileText,
    to: "/documents",
    color: "dashboard-tone-neutral dashboard-tone-icon",
  },
];

export function QuickActions({ compact = false }: { compact?: boolean }) {
  const visibleActions = compact ? actions.slice(0, 5) : actions;

  return (
    <section
      className={`space-y-4 rounded-xl border border-border/50 bg-card/35 ${compact ? "p-4" : "p-4 sm:p-5"}`}
    >
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="alexos-eyebrow alexos-eyebrow-accent">Quick actions</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">Move things forward.</h2>
          <p className="text-xs text-muted-foreground sm:text-sm">
            {compact ? "The things you use most." : "The things you use most, one swipe away."}
          </p>
        </div>
        <ChevronRight
          className="mb-1 size-4 shrink-0 text-muted-foreground sm:hidden"
          aria-hidden="true"
        />
      </div>

      <div
        className={`flex snap-x snap-mandatory gap-2.5 overflow-x-auto pb-2 pr-5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:overflow-visible sm:pb-0 ${compact ? "sm:grid-cols-5" : "sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7"}`}
        aria-label="Quick actions"
      >
        {visibleActions.map((action) => (
          <Link
            key={action.title}
            to={action.to}
            className="alexos-focusable min-w-[116px] snap-start rounded-xl sm:min-w-0"
          >
            <Card className="alexos-card-interactive h-full cursor-pointer">
              <CardContent className="flex min-h-[104px] flex-col items-center justify-center gap-2.5 p-3 sm:min-h-[128px] sm:gap-3 sm:p-4">
                <div
                  className={`grid size-10 place-items-center rounded-lg ring-1 sm:size-12 ${action.color}`}
                >
                  <action.icon aria-hidden="true" className="size-4 sm:size-5" />
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
