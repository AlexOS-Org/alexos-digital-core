import { Link } from "@tanstack/react-router";
import {
  BarChart3,
  Boxes,
  Megaphone,
  Package,
  Settings,
  ShoppingCart,
  Users,
  Wallet,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap } from "lucide-react";

const ACTIONS = [
  { to: "/e-commerce/products", label: "Add product", icon: Package },
  { to: "/e-commerce/checkout", label: "New order", icon: Wallet },
  { to: "/e-commerce/orders", label: "Fulfil", icon: ShoppingCart },
  { to: "/e-commerce/inventory", label: "Restock", icon: Boxes },
  { to: "/e-commerce/customers", label: "Customers", icon: Users },
  { to: "/e-commerce/marketing", label: "Campaigns", icon: Megaphone },
  { to: "/e-commerce/reports", label: "Reports", icon: BarChart3 },
  { to: "/e-commerce/settings", label: "Settings", icon: Settings },
] as const;

export function QuickActionsGrid({ columns = 4 }: { columns?: number }) {
  return (
    <Card className="h-full rounded-3xl border-border/60 soft-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <span className="grid h-7 w-7 place-items-center rounded-xl bg-primary/10 text-primary">
            <Zap className="h-3.5 w-3.5" />
          </span>
          Quick actions
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {ACTIONS.map((a) => (
            <Link
              key={a.to + a.label}
              to={a.to}
              className="press tap-target flex flex-col items-center gap-2 rounded-2xl border border-border/60 bg-card px-2 py-3.5 text-center transition-colors hover:border-primary/40 hover:bg-primary/[0.04]"
            >
              <a.icon className="h-5 w-5 text-primary" />
              <span className="text-[11px] font-medium leading-tight">{a.label}</span>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
