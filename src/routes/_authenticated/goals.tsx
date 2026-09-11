import { cn } from "@/lib/utils";
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Archive, Target, TrendingUp, CheckCircle2, Wallet } from "lucide-react";
import { useGoals, useGoalProgress, useArchiveGoal, type Goal } from "@/lib/goals/api";
import { useAccounts, useAccountBalances } from "@/lib/money/api";
import { formatMoney, formatDate } from "@/lib/money/format";
import {
  getAccountLogo,
  getInstitutionStyle,
} from "@/lib/money/institution-branding";
import { GoalFormDialog, GOAL_ICONS } from "@/components/goals/GoalFormDialog";
import { GoalContributeDialog } from "@/components/goals/GoalContributeDialog";
import { buildGoalProgressMap, resolveGoalProgress } from "@/lib/goals/progress";

export const Route = createFileRoute("/_authenticated/goals")({
  component: GoalsPage,
});

function GoalsPage() {
  const { data: goals = [], isLoading } = useGoals();
  const { data: progress = [] } = useGoalProgress();
  const { data: accounts = [] } = useAccounts();
  const { data: accountBalances = [] } = useAccountBalances();
  const archive = useArchiveGoal();
  const [formOpen, setFormOpen] = useState(false);
  const [contribOpen, setContribOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [contributing, setContributing] = useState<Goal | null>(null);

  const contributionProgressMap = buildGoalProgressMap(progress);
  const accountMap = new Map(accounts.map((a) => [a.id, a.name]));
  const goalProgressMap = new Map(
    goals.map((goal) => [
      goal.id,
      resolveGoalProgress(goal, contributionProgressMap.get(goal.id) ?? 0, accountBalances),
    ]),
  );

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

  const totalTarget = goals.reduce((s, g) => s + Number(g.target_amount), 0);
  const totalSaved = goals.reduce((s, g) => s + (goalProgressMap.get(g.id)?.currentAmount ?? 0), 0);
  const achieved = goals.filter((g) => g.status === "achieved").length;
  const overall = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Goals</h1>
          <p className="text-sm text-muted-foreground">
            Track savings goals and link each one to a bank or wallet account.
          </p>
        </div>
        <Button onClick={openNew} className="rounded-xl">
          <Plus className="h-4 w-4 mr-1" /> New Goal
        </Button>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active goals</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {goals.filter((g) => g.status === "active").length}
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Saved</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{formatMoney(totalSaved)}</CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overall progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{overall.toFixed(0)}%</div>
            <Progress value={Math.min(100, overall)} className="mt-2 h-2" />
          </CardContent>
        </Card>
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
            else. You can link each goal to a bank or wallet account (Equity, NCBA, Absa, Family
            Bank).
          </div>
        )}
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((g) => {
            const resolvedProgress = goalProgressMap.get(g.id);
            const current = resolvedProgress?.currentAmount ?? 0;
            const target = Number(g.target_amount);
            const pct = target > 0 ? Math.min(100, (Math.max(0, current) / target) * 100) : 0;
            const remaining = Math.max(0, target - current);
            const Icon = GOAL_ICONS[g.icon] ?? Target;
            const linkedAccount = g.account_id ? accountMap.get(g.account_id) : null;
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
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(g)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          archive.mutate({ id: g.id, archived: g.status !== "archived" })
                        }
                      >
                        <Archive className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-semibold">{formatMoney(current)}</span>
                      <span className="text-muted-foreground">of {formatMoney(target)}</span>
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

                  {linkedAccount ? (
                    <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5 min-w-0">
                        {(() => {
                          const inst = getInstitutionStyle(linkedAccount);
                          const logo = getAccountLogo(linkedAccount);
                          return logo ? (
                            <img
                              src={logo}
                              alt=""
                              className="h-4 w-4 shrink-0 rounded object-contain"
                              loading="lazy"
                            />
                          ) : (
                            <span
                              className={cn(
                                "grid h-4 w-4 shrink-0 place-items-center rounded text-[8px] font-bold",
                                inst.iconClass,
                              )}
                            >
                              {inst.initials}
                            </span>
                          );
                        })()}
                        <span className="truncate">Saving in {linkedAccount}</span>
                      </span>
                      <span className="font-medium text-foreground shrink-0">
                        {formatMoney(current)}
                      </span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openEdit(g)}
                      className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400 hover:underline"
                    >
                      <Wallet className="h-3.5 w-3.5 shrink-0" />
                      Link a savings account
                    </button>
                  )}

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
