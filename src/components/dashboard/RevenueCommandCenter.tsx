import { Link } from "@tanstack/react-router";
import { ArrowUpRight, CheckCircle2, ChevronRight, Clock3, Megaphone, Target, Users, WalletCards } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useContacts, useLeads } from "@/lib/crm/api";
import { useExpected } from "@/lib/money/api";
import { formatMoney } from "@/lib/money/format";
import { contactDisplayName } from "@/lib/crm/utils";

const nextAction: Record<string, string> = {
  new: "Contact now",
  contacted: "Follow up",
  qualified: "Move to offer",
  proposal: "Follow up on offer",
  negotiation: "Close the deal",
};

export default function RevenueCommandCenter() {
  const { data: leads = [], isLoading: leadsLoading } = useLeads();
  const { data: contacts = [], isLoading: contactsLoading } = useContacts();
  const { data: expected = [], isLoading: expectedLoading } = useExpected("pending");

  const contactMap = new Map(contacts.map((contact) => [contact.id, contact]));
  const openLeads = leads.filter((lead) => !["won", "lost"].includes(lead.stage));
  const hotLeads = openLeads.filter((lead) => Number(lead.probability ?? 0) >= 70);
  const priorityLeads = [...openLeads]
    .sort((a, b) => {
      const priorityA = Number(a.probability ?? 0) * Number(a.value ?? 0);
      const priorityB = Number(b.probability ?? 0) * Number(b.value ?? 0);
      return priorityB - priorityA;
    })
    .slice(0, 5);
  const pipeline = openLeads.reduce((sum, lead) => sum + Number(lead.value ?? 0), 0);
  const weightedPipeline = openLeads.reduce((sum, lead) => sum + Number(lead.value ?? 0) * (Number(lead.probability ?? 0) / 100), 0);
  const expectedMoney = expected.reduce((sum, item) => sum + Number(item.amount), 0);
  const loading = leadsLoading || contactsLoading || expectedLoading;

  const metrics = [
    { label: "Open leads", value: loading ? "…" : openLeads.length.toString(), detail: `${hotLeads.length} hot`, icon: Users, to: "/people/leads" },
    { label: "Pipeline", value: loading ? "…" : formatMoney(pipeline), detail: `${formatMoney(weightedPipeline)} weighted`, icon: Target, to: "/people/leads" },
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
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Your highest-value opportunities first, with the next action clear enough to take immediately.</p>
          </div>
          <Link to="/people/leads" className="inline-flex w-fit items-center gap-1.5 rounded-xl border border-primary/15 bg-primary/5 px-3 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/10">Work the pipeline<ArrowUpRight className="h-3.5 w-3.5" /></Link>
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

        <div className="mt-5 rounded-2xl border border-border/60 bg-background/60 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Priority follow-ups</p><h3 className="mt-1 text-base font-semibold">Work the opportunities most likely to pay</h3></div>
            <Link to="/people/leads" className="hidden items-center gap-1 text-xs font-semibold text-primary sm:inline-flex">Open pipeline <ChevronRight className="h-3.5 w-3.5" /></Link>
          </div>
          <div className="mt-4 flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {loading ? <div className="min-w-full rounded-xl bg-muted/40 p-4 text-sm text-muted-foreground">Loading your revenue opportunities…</div> : priorityLeads.length === 0 ? (
              <div className="flex min-w-full items-center gap-3 rounded-xl border border-dashed border-border p-4"><CheckCircle2 className="h-5 w-5 text-emerald-600" /><div><p className="text-sm font-semibold">No open opportunities yet.</p><p className="text-xs text-muted-foreground">Create your first lead and Orion can start prioritizing the work.</p></div><Link to="/people/leads" className="ml-auto shrink-0 text-xs font-semibold text-primary">Add lead</Link></div>
            ) : priorityLeads.map((lead) => {
              const contact = contactMap.get(lead.contact_id ?? "");
              const probability = Number(lead.probability ?? 0);
              const action = nextAction[lead.stage] ?? "Review lead";
              return (
                <Link key={lead.id} to="/people/leads" className="group min-w-[245px] snap-start rounded-xl border border-border/60 bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-sm sm:min-w-[280px]">
                  <div className="flex items-start justify-between gap-3"><div className={`flex h-8 w-8 items-center justify-center rounded-lg ${probability >= 70 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>{probability >= 70 ? <Clock3 className="h-4 w-4" /> : <Target className="h-4 w-4" />}</div><span className="text-xs font-bold">{formatMoney(Number(lead.value ?? 0))}</span></div>
                  <p className="mt-3 line-clamp-1 text-sm font-semibold">{contact ? contactDisplayName(contact) : lead.title}</p>
                  <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{contact ? lead.title : `${lead.stage} · ${lead.source ?? "No source"}`}</p>
                  <div className="mt-3 flex items-center justify-between gap-3"><span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{probability}% likely</span><span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">{action}<ArrowUpRight className="h-3 w-3" /></span></div>
                </Link>
              );
            })}
          </div>
          <Link to="/people/leads" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary sm:hidden">Open full pipeline <ChevronRight className="h-3.5 w-3.5" /></Link>
        </div>
      </div>
    </section>
  );
}
