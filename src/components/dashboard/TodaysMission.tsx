import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Clock3, ArrowUpRight, Target, Zap } from "lucide-react";
import { useBills } from "@/lib/money/bills";
import { useExpected } from "@/lib/money/api";
import { useDebts } from "@/lib/debts/api";

export default function TodaysMission() {
  const { data: bills = [] } = useBills();
  const { data: expected = [] } = useExpected("pending");
  const { data: debts = [] } = useDebts();
  const today = new Date().toISOString().slice(0, 10);
  const overdueBills = bills.filter((bill) => bill.status === "pending" && bill.due_date && bill.due_date < today).length;
  const expectedToday = expected.filter((item) => item.expected_date === today).length;
  const activeDebts = debts.filter((debt) => debt.status !== "paid").length;
  const tasks = [
    { title: "Review overdue bills", value: overdueBills, label: overdueBills ? "Needs attention" : "Clear", tone: "amber" },
    { title: "Expected payments today", value: expectedToday, label: expectedToday ? "Watch today" : "Nothing due", tone: "blue" },
    { title: "Active debts to monitor", value: activeDebts, label: activeDebts ? "Keep visible" : "All clear", tone: "violet" },
  ];

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#071329] text-white shadow-[0_24px_70px_-35px_rgba(37,99,235,.6)]">
      <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-violet-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 left-1/3 h-56 w-56 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="relative p-6 sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-200">
              <Target className="h-3.5 w-3.5" /> Today's mission
            </div>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Clear the blockers. Protect the momentum.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Orion is surfacing the few things most likely to matter today.</p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs text-slate-300">
            <Zap className="h-3.5 w-3.5 text-violet-300" /> {tasks.filter((t) => t.value > 0).length} active priorities
          </div>
        </div>
        <div className="mt-7 grid gap-3 lg:grid-cols-3">
          {tasks.map((task) => (
            <div key={task.title} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 backdrop-blur-sm transition-colors hover:bg-white/[0.07]">
              <div className="flex items-center justify-between gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${task.value > 0 ? "bg-amber-400/10 text-amber-300" : "bg-emerald-400/10 text-emerald-300"}`}>
                  {task.value > 0 ? <Clock3 className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
                </div>
                <span className="text-3xl font-bold tracking-tight">{task.value}</span>
              </div>
              <p className="mt-5 text-sm font-semibold">{task.title}</p>
              <div className="mt-1 flex items-center justify-between text-xs text-slate-400"><span>{task.label}</span><ArrowUpRight className="h-3.5 w-3.5" /></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
