import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Megaphone, Target, Users, WalletCards } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useLeads } from "@/lib/crm/api";
import { useExpected } from "@/lib/money/api";
import { formatMoney } from "@/lib/money/format";

export default function RevenueCommandCenter() {
  const { data: leads = [], isLoading: leadsLoading } = useLeads();
  const { data: expected = [], isLoading: expectedLoading } = useExpected("pending");

  const openLeads = leads.filter((lead) => !["won", "lost"].includes(lead.stage));
  const hotLeads = openLeads.filter((lead) => Number(lead.probability ?? 0) >= 70);
  const pipeline = openLeads.reduce((sum, lead) => sum + Number(lead.value ?? 0), 0);
  const weightedPipeline = openLeads.reduce((sum, lead) => sum + Number(lead.value ?? 0) * (Number(lead.probability ?? 0) / 100), 0);
  const expectedMoney = expected.reduce((sum, item) => sum + Number(item.amount), 0);
  const loading = leadsLoading || expectedLoading;

  const metrics = [
    { label: "Open leads", value: loading ? "…" : openLeads.length.toString(), detail: `${hotLeads.length} hot`, icon: Users, to: "/people" },
    { label: "Pipeline", value: loading ? "…" : formatMoney(pipeline), detail: `${formatMoney(weightedPipeline)} weighted`, icon: Target, to: "/people" },
    { label: "Expected money", value: loading ? "…" : formatMoney(expectedMoney), detail: `${expected.length} pending`, icon: WalletCards, to: "/money-center" },
  ];

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-primary/15 bg-gradient-to-br from-card via-card to-primary/[0.04] shadow-sm">
      <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative p-5 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary"><Megaphone className="h-3.5 w-3.5" /> Revenue command center</div>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Turn attention into money.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">One view for the opportunities, expected money and customer activity that can move revenue forward.</p>
          </div>
          <Link to="/people" className="inline-flex w-fit items-center gap-1.5 rounded-xl border border-primary/15 bg-primary/5 px-3 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/10">Work the pipeline<ArrowUpRight className="h-3.5 w-3.5" /></Link>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <Link key={metric.label} to={metric.to} className="group">
                <Card className="h-full rounded-2xl border-border/60 bg-background/70 shadow-none transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div><ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" /></div>
                    <p className="mt-5 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">{metric.label}</p>
                    <p className="mt-1 text-2xl font-bold tracking-tight">{metric.value}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{metric.detail}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
