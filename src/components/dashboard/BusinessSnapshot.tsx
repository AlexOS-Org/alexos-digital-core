import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Car, Megaphone, ShoppingBag, Sparkles, TrendingUp, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useContacts, useLeads } from "@/lib/crm/api";
import { formatMoney } from "@/lib/money/format";

export default function BusinessSnapshot() {
  const { data: contacts = [], isLoading: contactsLoading } = useContacts();
  const { data: leads = [], isLoading: leadsLoading } = useLeads();
  const openLeads = leads.filter((lead) => !["won", "lost"].includes(lead.stage));
  const weightedPipeline = openLeads.reduce((sum, lead) => sum + Number(lead.value ?? 0) * (Number(lead.probability ?? 0) / 100), 0);
  const leadCount = openLeads.length;
  const loading = contactsLoading || leadsLoading;

  const businessItems = [
    { title: "CRM", value: loading ? "…" : String(contacts.length), description: `${leadCount} open lead${leadCount === 1 ? "" : "s"} · ${formatMoney(weightedPipeline)} weighted pipeline`, icon: Users, url: "/people", accent: "from-blue-500 to-cyan-400" },
    { title: "Vehicle Sales", value: "Open", description: "Inventory, financing and active deals", icon: Car, url: "/vehicle-sales", accent: "from-violet-500 to-fuchsia-400" },
    { title: "DailyGear", value: "Open", description: "Products, orders and online sales", icon: ShoppingBag, url: "/e-commerce", accent: "from-emerald-500 to-teal-400" },
    { title: "Marketing", value: "Open", description: "Campaigns and lead generation", icon: Megaphone, url: "/marketing", accent: "from-amber-500 to-orange-400" },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {businessItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link key={item.title} to={item.url} className="group">
            <Card className="relative h-full overflow-hidden rounded-[1.6rem] border-border/60 bg-card/80 transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:shadow-xl">
              <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${item.accent}`} />
              <CardContent className="relative p-5">
                <div className="flex items-center justify-between"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm"><Icon className="h-5 w-5" /></div><ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></div>
                <div className="mt-7 flex items-end justify-between gap-3"><div><p className="text-sm font-semibold">{item.title}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{item.description}</p></div><p className="text-2xl font-bold tracking-tight">{item.value}</p></div>
                <div className="mt-5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"><Sparkles className="h-3 w-3 text-primary" /> Revenue path</div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
