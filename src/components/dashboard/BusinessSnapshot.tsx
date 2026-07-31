import { Card, CardContent } from "@/components/ui/card";
import { Users, Car, ShoppingBag, Megaphone, ArrowUpRight, Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";

const businessItems = [
  { title: "CRM", value: "0", description: "Customers, contacts and leads", icon: Users, url: "/people", accent: "from-blue-500 to-cyan-400" },
  { title: "Vehicle Sales", value: "0", description: "Inventory and active deals", icon: Car, url: "/vehicle-sales", accent: "from-violet-500 to-fuchsia-400" },
  { title: "DailyGear", value: "0", description: "Products and orders", icon: ShoppingBag, url: "/e-commerce", accent: "from-emerald-500 to-teal-400" },
  { title: "Marketing", value: "0", description: "Campaigns and lead generation", icon: Megaphone, url: "/marketing", accent: "from-amber-500 to-orange-400" },
];

export default function BusinessSnapshot() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {businessItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link key={item.title} to={item.url} className="group">
            <Card className="relative h-full overflow-hidden rounded-[1.6rem] border-border/60 bg-card/80 transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:shadow-xl">
              <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${item.accent}`} />
              <CardContent className="relative p-5">
                <div className="flex items-center justify-between">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${item.accent} bg-opacity-10 text-white shadow-sm`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </div>
                <div className="mt-7 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.description}</p>
                  </div>
                  <p className="text-2xl font-bold tracking-tight">{item.value}</p>
                </div>
                <div className="mt-5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  <Sparkles className="h-3 w-3 text-primary" /> AlexOS connected
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
