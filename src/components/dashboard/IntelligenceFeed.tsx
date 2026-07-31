import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Brain,
  TrendingUp,
  Car,
  ShoppingBag,
  Landmark,
  Target,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";

const insights = [
  {
    icon: TrendingUp,
    title: "Cash Flow",
    message: "Record every income and expense to sharpen Orion's financial picture.",
  },
  {
    icon: Car,
    title: "Vehicle Sales",
    message: "Follow up financing leads daily to keep your strongest opportunities moving.",
  },
  {
    icon: ShoppingBag,
    title: "DailyGear",
    message: "Stay consistent with products that show the clearest demand signals.",
  },
  {
    icon: Landmark,
    title: "Banking",
    message: "Turn customer conversations into scheduled follow-ups before they go cold.",
  },
  {
    icon: Target,
    title: "Productivity",
    message: "Finish today's highest-impact mission before opening another front.",
  },
];

export default function IntelligenceFeed() {
  return (
    <Card className="h-full overflow-hidden rounded-[1.8rem] border-[var(--orion-purple)]/20 bg-gradient-to-br from-[#0a1530] via-[#101a38] to-[#171333] text-white shadow-[0_22px_60px_-35px_rgba(124,58,237,.7)]">
      <CardHeader className="relative flex flex-row items-center justify-between gap-3 border-b border-white/10 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-300/15 bg-violet-400/10 text-violet-200">
            <Brain className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base text-white">Orion Intelligence Feed</CardTitle>
            <p className="mt-0.5 text-xs text-slate-400">Signals worth acting on next</p>
          </div>
        </div>
        <span className="flex items-center gap-1.5 rounded-full border border-violet-300/15 bg-violet-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-violet-200">
          <Sparkles className="h-3 w-3" /> Live
        </span>
      </CardHeader>
      <CardContent className="relative space-y-2 p-4 sm:p-5">
        {insights.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="group flex gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.035] p-3.5 transition-all hover:border-violet-300/20 hover:bg-white/[0.07]"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-violet-200">
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">{item.title}</p>
                  <span className="text-[10px] text-slate-500">0{index + 1}</span>
                </div>
                <p className="mt-1 text-xs leading-5 text-slate-400">{item.message}</p>
              </div>
              <ArrowUpRight className="mt-1 h-3.5 w-3.5 shrink-0 text-slate-500 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
