import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Brain,
  TrendingUp,
  Car,
  ShoppingBag,
  Landmark,
  Target,
} from "lucide-react";

const insights = [
  {
    icon: TrendingUp,
    title: "Cash Flow",
    message: "Record every income and expense to improve Orion's predictions.",
  },
  {
    icon: Car,
    title: "Car Bar Motion.ke",
    message: "Follow up vehicle financing leads daily for higher conversion.",
  },
  {
    icon: ShoppingBag,
    title: "DailyGear",
    message: "Post consistently and monitor products with the highest demand.",
  },
  {
    icon: Landmark,
    title: "Banking",
    message: "Track customer interactions and schedule follow-ups immediately.",
  },
  {
    icon: Target,
    title: "Productivity",
    message: "Complete today's mission before opening new tasks.",
  },
];

export default function IntelligenceFeed() {
  return (
    <Card className="rounded-2xl">
      <CardHeader className="flex flex-row items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Brain className="h-5 w-5 text-primary" />
        </div>

        <div>
          <CardTitle>Orion Intelligence Feed</CardTitle>

          <p className="text-sm text-muted-foreground">
            Recommendations from your AI Business Partner.
          </p>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {insights.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="flex gap-4 rounded-xl border p-4"
            >
              <div className="rounded-xl bg-primary/10 p-2 h-fit">
                <Icon className="h-5 w-5 text-primary" />
              </div>

              <div>
                <p className="font-semibold">{item.title}</p>

                <p className="text-sm text-muted-foreground">
                  {item.message}
                </p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}