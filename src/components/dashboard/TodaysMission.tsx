import { Link } from "@tanstack/react-router";
import { ArrowUpRight, CheckCircle2, Clock3, DollarSign, Target, Wallet, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useBills } from "@/lib/money/bills";
import { useExpected } from "@/lib/money/api";
import { useDebts } from "@/lib/debts/api";
import { formatMoney } from "@/lib/money/format";

export default function TodaysMission() {
  const { data: bills = [] } = useBills();
  const { data: expected = [] } = useExpected("pending");
  const { data: debts = [] } = useDebts();
  const today = new Date().toISOString().slice(0, 10);

  const overdueBills = bills.filter((bill) => bill.status === "pending" && bill.due_date < today);
  const expectedToday = expected.filter((item) => item.expected_date === today);
  const expectedTodayAmount = expectedToday.reduce((sum, item) => sum + Number(item.amount), 0);
  const activeDebts = debts.filter((debt) => debt.status !== "paid");
  const highPriorityDebts = activeDebts.filter((debt) => debt.priority === "high").length;

  const priorities = [
    {
      title: "Protect cash",
      detail: overdueBills.length ? `${overdueBills.length} overdue bill${overdueBills.length === 1 ? "" : "s"} need review.` : "No overdue bills are asking for attention.",
      value: overdueBills.length,
      action: "Review bills",
      to: "/money-center",
      icon: Wallet,
      active: overdueBills.length > 0,
    },
    {
      title: "Capture expected money",
      detail: expectedToday.length ? `${expectedToday.length} expected payment${expectedToday.length === 1 ? "" : "s"} today.` : "No expected payment is scheduled for today.",
      value: expectedTodayAmount,
      action: "Open expected money",
      to: "/money-center",
      icon: DollarSign,
      active: expectedToday.length > 0,
      money: true,
    },
    {
      title: "Control liabilities",
      detail: activeDebts.length ? `${activeDebts.length} active debt${activeDebts.length === 1 ? "" : "s"}${highPriorityDebts ? ` · ${highPriorityDebts} high priority` : ""}.` : "No active debt is currently recorded.",
      value: activeDebts.length,
      action: "Review debt",
      to: "/debt-management",
      icon: Target,
      active: highPriorityDebts > 0 || activeDebts.length > 0,
    },
  ];

  const activeCount = priorities.filter((item) => item.active).length;

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-primary/15 bg-card text-card-foreground shadow-sm">
      <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative p-5 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary"><Target className="h-3.5 w-3.5" /> Today&apos;s mission</div>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Protect cash. Capture opportunity. Keep moving.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Orion turns what is already in AlexOS into the few financial actions most worth taking today.</p>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/70 bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground"><Zap className="h-3.5 w-3.5 text-primary" /> {activeCount} active priorities</div>
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-3">
          {priorities.map((item) => {
            const Icon = item.icon;
            const needsAttention = item.active;
            return (
              <Card key={item.title} className="rounded-2xl border-border/60 bg-background/70 shadow-none transition-all hover:-translate-y-0.5 hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${needsAttention ? "bg-primary/10 text-primary" : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"}`}>
                      {needsAttention ? <Clock3 className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
                    </div>
                    <span className="text-right text-xl font-bold tracking-tight">{item.money ? formatMoney(item.value) : item.value}</span>
                  </div>
                  <p className="mt-4 text-sm font-semibold">{item.title}</p>
                  <p className="mt-1 min-h-10 text-xs leading-5 text-muted-foreground">{item.detail}</p>
                  <Link to={item.to} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">{item.action}<ArrowUpRight className="h-3.5 w-3.5" /></Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
