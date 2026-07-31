import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Archive, Target, TrendingUp, CheckCircle2 } from "lucide-react";
import { useGoals, useGoalProgress, useArchiveGoal, type Goal } from "@/lib/goals/api";
import { formatMoney, formatDate } from "@/lib/money/format";
import { GoalFormDialog, GOAL_ICONS } from "@/components/goals/GoalFormDialog";
import { GoalContributeDialog } from "@/components/goals/GoalContributeDialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/goals")({
  component: GoalsPage,
});

function GoalsPage() {
  const { data: goals = [], isLoading } = useGoals();
  const { data: progress = [] } = useGoalProgress();
  const archive = useArchiveGoal();
  const [formOpen, setFormOpen] = useState(false);
  const [contribOpen, setContribOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [contributing, setContributing] = useState<Goal | null>(null);

  const progressMap = new Map(progress.map((p) => [p.goal_id, Number(p.current_amount)]));
  const totalTarget = goals.reduce((s, g) => s + Number(g.target_amount), 0);
  const totalSaved = goals.reduce((s, g) => s + (progressMap.get(g.id) ?? 0), 0);
  const achieved = goals.filter((g) => g.status === "achieved").length;
  const overall = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (g: Goal) => {
    setEditing(g);
    setFormOpen(true);
  };
  const openContribute = (g: Goal) => {
    setContributing(g);
    setContribOpen(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <Card className="rounded-2xl border border-emerald-200/70 dark:border-emerald-900/50 bg-gradient-to-br from-emerald-600 via-emerald-600 to-teal-600 text-white shadow-sm">
        <CardContent className="p-6 sm:p-8 space-y-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="text-[11px] uppercase tracking-widest text-white/70">Goals</div>
              <div className="mt-1 text-sm text-white/75">Total Saved</div>
              <div className="text-3xl sm:text-4xl font-semibold tracking-tight mt-1">
                {formatMoney(totalSaved)}
              </div>
              <div className="text-xs text-white/70 mt-1">of {formatMoney(totalTarget)} target</div>
            </div>
            <Button
              onClick={openNew}
              variant="secondary"
              className="rounded-xl bg-white/95 text-emerald-700 hover:bg-white"
            >
              <Plus className="h-4 w-4 mr-1" /> New Goal
            </Button>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-white/85">
              <span>Overall Progress</span>
              <span>{overall.toFixed(1)}%</span>
            </div>
            <Progress value={overall} className="h-2 bg-white/20 [&>div]:bg-white" />
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-3 grid-cols-3">
        {[
          {
            label: "Active Goals",
            value: goals.filter((g) => g.status === "active").length,
            icon: Target,
            tone: "text-emerald-600 dark:text-emerald-400",
          },
          {
            label: "Achieved",
            value: achieved,
            icon: CheckCircle2,
            tone: "text-[color:var(--success)]",
          },
          {
            label: "In Progress",
            value: `${overall.toFixed(0)}%`,
            icon: TrendingUp,
            tone: "text-amber-600 dark:text-amber-400",
          },
        ].map((k) => (
          <Card key={k.label} className="rounded-2xl">
            <CardHeader className="pb-1 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                {k.label}
              </CardTitle>
              <k.icon className={cn("h-4 w-4", k.tone)} />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold tracking-tight">{k.value}</div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Your Goals</h2>
        {isLoading && (
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-2xl" />
            ))}
          </div>
        )}
        {!isLoading && goals.length === 0 && (
          <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
            No goals yet. Add your first goal — Audi Fund, Emergency Fund, School Fees, or anything
            else.
          </div>
        )}
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((g) => {
            const current = progressMap.get(g.id) ?? 0;
            const target = Number(g.target_amount);
            const pct = target > 0 ? Math.min(100, (current / target) * 100) : 0;
            const remaining = Math.max(0, target - current);
            const Icon = GOAL_ICONS[g.icon] ?? Target;
            return (
              <Card key={g.id} className="rounded-2xl transition-shadow hover:shadow-md">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-11 w-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400 grid place-items-center shrink-0">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium truncate">{g.name}</div>
                        <div className="text-xs text-muted-foreground flex gap-2 items-center">
                          <span>{g.category ?? "—"}</span>
                          {g.status !== "active" && (
                            <Badge variant="secondary" className="capitalize text-[10px]">
                              {g.status}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(g)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => archive.mutate(g.id)}>
                        <Archive className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>{formatMoney(current)}</span>
                      <span>{formatMoney(target)}</span>
                    </div>
                    <Progress
                      value={pct}
                      className="h-2 bg-emerald-100 dark:bg-emerald-950 [&>div]:bg-emerald-500"
                    />
                    <div className="flex justify-between text-xs mt-1">
                      <span className="font-medium text-emerald-700 dark:text-emerald-400">
                        {pct.toFixed(1)}%
                      </span>
                      <span className="text-muted-foreground">{formatMoney(remaining)} to go</span>
                    </div>
                  </div>

                  {g.target_date && (
                    <div className="text-xs text-muted-foreground">
                      Target: {formatDate(g.target_date)}
                    </div>
                  )}
                  <Button
                    size="sm"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => openContribute(g)}
                    disabled={g.status !== "active"}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add Contribution
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <GoalFormDialog open={formOpen} onOpenChange={setFormOpen} goal={editing} />
      <GoalContributeDialog open={contribOpen} onOpenChange={setContribOpen} goal={contributing} />
    </div>
  );
}
