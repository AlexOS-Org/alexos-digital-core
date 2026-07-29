import { Link } from "@tanstack/react-router";
import { Receipt, UserPlus, CalendarPlus, Plus, Target, Wallet, FileText, ChevronRight, Hand } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const actions = [
  { title: "Add Transaction", icon: Receipt, to: "/money-center", color: "bg-sky-50 text-sky-600 ring-sky-100" },
  { title: "New Customer", icon: UserPlus, to: "/people", color: "bg-emerald-50 text-emerald-600 ring-emerald-100" },
  { title: "Create Task", icon: Plus, to: "/tasks", color: "bg-violet-50 text-violet-600 ring-violet-100" },
  { title: "Schedule", icon: CalendarPlus, to: "/calendar", color: "bg-rose-50 text-rose-600 ring-rose-100" },
  { title: "Goals", icon: Target, to: "/goals", color: "bg-amber-50 text-amber-600 ring-amber-100" },
  { title: "Debt", icon: Wallet, to: "/debt-management", color: "bg-orange-50 text-orange-600 ring-orange-100" },
  { title: "Documents", icon: FileText, to: "/documents", color: "bg-slate-50 text-slate-600 ring-slate-100" },
];

export function QuickActions() {
  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Shortcuts</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">Quick Actions</h2>
          <p className="text-sm text-muted-foreground">The things you use most, one swipe away.</p>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground sm:hidden"><Hand className="h-3.5 w-3.5" /><span>Swipe</span><ChevronRight className="h-3.5 w-3.5" /></div>
      </div>

      <div className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-3 pr-6 touch-pan-x overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:p-0 lg:grid-cols-4 xl:grid-cols-7" aria-label="Quick actions" tabIndex={0}>
        {actions.map((action) => (
          <Link key={action.title} to={action.to} className="min-w-[148px] snap-start sm:min-w-0">
            <Card className="h-full cursor-pointer rounded-2xl border-border/60 bg-card/90 transition-all active:scale-[0.98] hover:-translate-y-0.5 hover:shadow-lg">
              <CardContent className="flex min-h-[118px] flex-col items-center justify-center gap-3 p-4 sm:min-h-[128px]">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ring-1 ${action.color}`}><action.icon className="h-5 w-5" /></div>
                <span className="text-center text-xs font-semibold leading-5 sm:text-sm">{action.title}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
