import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Car, ShoppingBag, Megaphone, ArrowUpRight } from "lucide-react";
import { Link } from "@tanstack/react-router";

const businessItems = [
  {
    title: "CRM",
    value: "0",
    description: "Customers, contacts and leads",
    icon: Users,
    url: "/people",
  },
  {
    title: "Vehicle Sales",
    value: "0",
    description: "Inventory and active deals",
    icon: Car,
    url: "/vehicle-sales",
  },
  {
    title: "DailyGear",
    value: "0",
    description: "Products and orders",
    icon: ShoppingBag,
    url: "/e-commerce",
  },
  {
    title: "Marketing",
    value: "0",
    description: "Campaigns and lead generation",
    icon: Megaphone,
    url: "/marketing",
  },
];

export default function BusinessSnapshot() {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      {businessItems.map((item) => (
        <Link key={item.title} to={item.url}>
          <Card
            className="
              rounded-2xl 
              border-border/60
              hover:border-primary/40
              hover:shadow-md
              hover:-translate-y-0.5
              transition-all
              h-full
            "
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium">{item.title}</CardTitle>

              <div className="flex items-center gap-2">
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />

                <div
                  className="
                  h-10 
                  w-10 
                  rounded-xl 
                  bg-primary/10 
                  text-primary 
                  flex 
                  items-center 
                  justify-center
                "
                >
                  <item.icon className="h-5 w-5" />
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <p className="text-2xl font-bold">{item.value}</p>

              <p className="text-xs text-muted-foreground mt-2">{item.description}</p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
