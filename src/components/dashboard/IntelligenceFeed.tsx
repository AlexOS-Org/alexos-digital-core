import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Brain, CircleDollarSign, HandCoins, Users, Wallet, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLeads } from "@/lib/crm/api";
import { useExpected } from "@/lib/money/api";
import { useDebts } from "@/lib/debts/api";
import { formatMoney } from "@/lib/money/format";

export default function IntelligenceFeed() {
  const { data: leads = [], isLoading: leadsLoading } = useLeads();
  const { data: expected = [], isLoading: expectedLoading } = useExpected("pending");
  const { data: debts = [], isLoading: debtsLoading } = useDebts();

  const today = new Date().toISOString().slice(0, 10);
  const openLeads = leads.filter((lead) => !["won", "lost"].includes(lead.stage));
  const weightedPipeline = openLeads.reduce((sum, lead) => sum + Number(lead.value ?? 0) * (Number(lead.probability ?? 0) / 100), 0);
  const expectedPending = expected.reduce((sum, item) => sum + Number(item.amount), 0);
  const expectedToday = expected.filter((item) => item.expected_date === today).length;
  const highPriorityDebts = debts.filter((debt) => debt.status !== "paid" && debt.priority === "high").length;

  const insights = [
    {
      icon: Users,
      title: openLeads.length ? "Revenue pipeline needs movement" : "Build the revenue pipeline",
      message: openLeads.length ? `${openLeads.length} open lead${openLeads.length === 1 ? "" : "s"} represent ${formatMoney(weightedPipeline)} in weighted opportunity. Follow up before opening another front.` : "Your CRM has no open leads yet. Adding and following up with prospects gives Orion something real to prioritize.",
      to: "/people",
      tone: "blue",
    },
    {
      icon: HandCoins,
      title: expectedPending ? "Expected money is waiting to be captured" : "Create expected-money visibility",
      message: expectedPending ? `${formatMoney(expectedPending)} is currently marked as pending${expectedToday ? ` · ${expectedToday} due today` : ""}. Keep expected income separate from cash until it actually arrives.` : "Record expected income when you have a credible commitment so Orion can help protect your cash plan.",
      to: "/money-center",
      tone: "emerald",
    },
    {
      icon: Wallet,
      title: highPriorityDebts ? "High-priority liabilities need attention" : "Keep liabilities visible",
      message: highPriorityDebts ? `${highPriorityDebts} high-priority debt${highPriorityDebts === 1 ? "" : "s"} need monitoring. Protect cash before taking on another commitment.` : "Orion will surface high-priority debt here when it exists, helping you protect cash and avoid avoidable pressure.",
      to: "/debt-management",
      tone: "amber",
    },
    {
      icon: CircleDollarSign,
      title: "Money follows action",
      message: "Use the mission above to turn a signal into an action, then record the result. That creates the feedback loop Orion needs to become more useful.",
      to: "/tasks",
      tone: "violet",
    },
  ];

  const loading = leadsLoading || expectedLoading || debtsLoading;

  return (
    <Card className="h-full overflow-hidden rounded-[1.8rem] border-primary/15 bg-card shadow-sm">
      <CardHeader className="relative flex flex-row items-center justify-between gap-3 border-b border-border/60 pb-5">
        <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/10 bg-primary/10 text-primary"><Brain className="h-5 w-5" /></div><div><CardTitle className="text-base">Orion Intelligence Feed</CardTitle><p className="mt-0.5 text-xs text-muted-foreground">Signals connected to money and action</p></div></div>
        <span className="flex items-center gap-1.5 rounded-full border border-primary/10 bg-primary/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary"><Sparkles className="h-3 w-3" /> Live</span>
      </CardHeader>
      <CardContent className="relative space-y-2 p-4 sm:p-5">
        {loading && <div className="rounded-2xl border border-border/60 bg-muted/30 p-4 text-xs text-muted-foreground">Orion is refreshing your signals…</div>}
        {!loading && insights.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.title} to={item.to} className="group flex gap-3 rounded-2xl border border-border/60 bg-background/60 p-3.5 transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:bg-primary/[0.03] hover:shadow-sm">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-4 w-4" /></div>
              <div className="min-w-0 flex-1"><p className="text-sm font-semibold">{item.title}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{item.message}</p><span className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-primary">Take action<ArrowUpRight className="h-3 w-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></span></div>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
