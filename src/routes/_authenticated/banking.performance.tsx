import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Gauge, RefreshCw, Settings2, Target } from "lucide-react";
import { toast } from "sonner";
import { useBusinessContext } from "@/lib/businesses/context";
import {
  applyContractKpiTemplate,
  calculateKpiAchievement,
  calculateOverallAchievement,
  calculateWeightedContribution,
  ensurePerformancePeriod,
  saveKpiTarget,
  savePerformanceSnapshot,
  useBankingKpiDefinitions,
  useBankingKpiPerformance,
  useBankingKpiTargets,
  useBankingPerformancePeriods,
  type BankingKpiTarget,
  type BankingPerformancePeriod,
} from "@/lib/banking/performance";

export const Route = createFileRoute("/_authenticated/banking/performance")({
  component: BankingPerformancePage,
});

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function BankingPerformancePage() {
  const { business } = useBusinessContext();
  const definitions = useBankingKpiDefinitions();
  const targets = useBankingKpiTargets();
  const periods = useBankingPerformancePeriods();
  const [month, setMonth] = useState(currentMonth);
  const [targetScope, setTargetScope] = useState<"contractual" | "internal">("contractual");
  const [period, setPeriod] = useState<BankingPerformancePeriod | null>(null);
  const [actuals, setActuals] = useState<Record<string, number>>({});
  const [targetDrafts, setTargetDrafts] = useState<Record<string, number | null>>({});
  const [working, setWorking] = useState(false);
  const [templateWorking, setTemplateWorking] = useState(false);

  const existingPeriod = useMemo(
    () =>
      (periods.data ?? []).find(
        (item) => item.period_start.startsWith(month) && item.target_scope === targetScope,
      ),
    [periods.data, month, targetScope],
  );
  const performance = useBankingKpiPerformance(period?.id ?? existingPeriod?.id ?? null);

  const targetByDefinition = useMemo(() => {
    const map = new Map<string, BankingKpiTarget>();
    for (const target of targets.data ?? []) {
      if (target.period_start === null && target.target_scope === targetScope) {
        map.set(target.kpi_definition_id, target);
      }
    }
    return map;
  }, [targets.data, targetScope]);

  useEffect(() => {
    if (existingPeriod) setPeriod(existingPeriod);
    else setPeriod(null);
  }, [existingPeriod]);

  useEffect(() => {
    const next: Record<string, number | null> = {};
    for (const definition of definitions.data ?? []) {
      const target = targetByDefinition.get(definition.id);
      next[definition.id] = target?.target_value ?? null;
    }
    setTargetDrafts(next);
  }, [definitions.data, targetByDefinition]);

  useEffect(() => {
    const next: Record<string, number> = {};
    for (const row of performance.data ?? []) next[row.kpi_definition_id] = row.actual_value;
    setActuals(next);
  }, [performance.data]);

  const rows = useMemo(
    () =>
      (definitions.data ?? [])
        .filter((definition) => definition.active)
        .map((definition) => ({
          definition,
          target: targetDrafts[definition.id] ?? 0,
          actual: actuals[definition.id] ?? 0,
          targetRecord: targetByDefinition.get(definition.id),
        })),
    [definitions.data, targetDrafts, actuals, targetByDefinition],
  );

  const configuredRows = rows.filter((row) => row.target !== null && row.target > 0);
  const missingTargets = rows.filter((row) => row.target === null || row.target <= 0);
  const totalWeight = rows.reduce((sum, row) => sum + row.definition.weight_percent, 0);
  const liveOverall = calculateOverallAchievement(
    configuredRows.map((row) => ({
      actual_value: row.actual,
      target_value: row.target,
      weight_percent: row.definition.weight_percent,
    })),
  );

  const loadTemplate = async () => {
    setTemplateWorking(true);
    try {
      const result = await applyContractKpiTemplate();
      toast.success(
        result.inserted
          ? `Loaded ${result.inserted} contractual KPIs and targets.`
          : "Your personal KPI template already exists.",
      );
      await Promise.all([definitions.refetch(), targets.refetch()]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load KPI template");
    } finally {
      setTemplateWorking(false);
    }
  };

  const saveTargets = async () => {
    setWorking(true);
    try {
      for (const row of rows) {
        await saveKpiTarget({
          business_id: null,
          kpi_definition_id: row.definition.id,
          target_scope: targetScope,
          target_value: targetDrafts[row.definition.id] ?? 0,
          source_reference:
            row.targetRecord?.source_reference ?? "Banking Growth KPI configuration",
          notes: row.targetRecord?.notes ?? null,
        });
      }
      await targets.refetch();
      toast.success("KPI targets saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save targets");
    } finally {
      setWorking(false);
    }
  };

  const saveMonth = async () => {
    if (!rows.length) {
      toast.error("Load or configure the KPI template first.");
      return;
    }
    if (missingTargets.length) {
      toast.error("Every active KPI needs a target before monthly performance can be saved.");
      return;
    }
    if (Math.abs(totalWeight - 100) > 0.001) {
      toast.error(`Active KPI weights must total 100%. Current total: ${totalWeight.toFixed(1)}%.`);
      return;
    }

    setWorking(true);
    try {
      const ensured = await ensurePerformancePeriod(month, targetScope);
      await savePerformanceSnapshot(
        ensured,
        rows.map((row) => ({
          kpi_definition_id: row.definition.id,
          target_id: row.targetRecord?.id ?? null,
          target_scope: targetScope,
          target_value: row.target,
          actual_value: actuals[row.definition.id] ?? 0,
          weight_percent: row.definition.weight_percent,
        })),
      );
      setPeriod(ensured);
      await Promise.all([periods.refetch(), performance.refetch()]);
      toast.success(
        `${month} performance saved — ${liveOverall.toFixed(1)}% weighted achievement.`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save monthly performance");
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Banking Growth · Phase 3</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">KPI & Performance</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Measure contractual targets, actual delivery and weighted achievement for{" "}
            {business?.name ?? "your personal KCB workspace"}. Monthly snapshots are retained
            separately from the current KPI configuration.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void loadTemplate()}
            disabled={templateWorking}
            className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-accent disabled:opacity-50"
          >
            <Settings2 className="h-4 w-4" />{" "}
            {templateWorking ? "Loading…" : "Load contract KPI template"}
          </button>
          <button
            type="button"
            onClick={() => {
              void definitions.refetch();
              void targets.refetch();
              void periods.refetch();
            }}
            className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-accent"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric icon={Gauge} label="Weighted achievement" value={`${liveOverall.toFixed(1)}%`} />
        <Metric icon={Target} label="Active KPIs" value={rows.length} />
        <Metric icon={CheckCircle2} label="Configured targets" value={configuredRows.length} />
        <Metric icon={Gauge} label="Weight coverage" value={`${totalWeight.toFixed(1)}%`} />
      </div>

      <section className="rounded-2xl border bg-card">
        <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-semibold">Monthly performance</h2>
            <p className="text-xs text-muted-foreground">
              Achievement = actual ÷ target × 100. Weighted contribution = achievement × weight ÷
              100.
            </p>
            <div className="mt-2 flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Target profile:</span>
              <select
                value={targetScope}
                onChange={(event) =>
                  setTargetScope(event.target.value as "contractual" | "internal")
                }
                className="rounded-lg border bg-background px-2 py-1"
              >
                <option value="contractual">Contractual</option>
                <option value="internal">Internal</option>
              </select>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              type="month"
              value={month}
              onChange={(event) => setMonth(event.target.value)}
              className="rounded-lg border bg-background px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => void saveMonth()}
              disabled={working || !rows.length}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {working ? "Saving…" : "Save month"}
            </button>
          </div>
        </div>

        {!rows.length ? (
          <div className="p-10 text-center">
            <p className="font-medium">No KPI configuration yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Load the supplied contract KPI template, then adjust targets where the contract or
              your internal target requires it.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="border-b bg-muted/30 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="p-3">KPI</th>
                  <th className="p-3">Scope</th>
                  <th className="p-3">Weight</th>
                  <th className="p-3">Target</th>
                  <th className="p-3">Actual ({month})</th>
                  <th className="p-3">Achievement</th>
                  <th className="p-3">Weighted</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((row) => {
                  const achievement = calculateKpiAchievement(row.actual, row.target);
                  const weighted = calculateWeightedContribution(
                    achievement,
                    row.definition.weight_percent,
                  );
                  return (
                    <tr key={row.definition.id}>
                      <td className="p-3">
                        <p className="font-medium">{row.definition.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {row.definition.category} · {row.definition.code}
                        </p>
                      </td>
                      <td className="p-3 capitalize">{targetScope}</td>
                      <td className="p-3">{row.definition.weight_percent}%</td>
                      <td className="p-3">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={targetDrafts[row.definition.id] ?? ""}
                          onChange={(event) =>
                            setTargetDrafts((current) => ({
                              ...current,
                              [row.definition.id]:
                                event.target.value === "" ? null : Number(event.target.value),
                            }))
                          }
                          className="w-32 rounded-lg border bg-background px-2 py-1.5"
                        />
                        <span className="ml-2 text-xs text-muted-foreground">
                          {row.definition.unit}
                        </span>
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={actuals[row.definition.id] ?? 0}
                          onChange={(event) =>
                            setActuals((current) => ({
                              ...current,
                              [row.definition.id]: Number(event.target.value) || 0,
                            }))
                          }
                          className="w-32 rounded-lg border bg-background px-2 py-1.5"
                        />
                      </td>
                      <td className="p-3">
                        {row.target !== null && row.target > 0 ? (
                          <span className="font-medium">{achievement.toFixed(1)}%</span>
                        ) : (
                          <span className="text-amber-600">Target required</span>
                        )}
                      </td>
                      <td className="p-3 font-medium">{weighted.toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="border-t bg-muted/20">
                <tr>
                  <td className="p-3 font-semibold" colSpan={2}>
                    Overall
                  </td>
                  <td className="p-3 font-semibold">{totalWeight.toFixed(1)}%</td>
                  <td className="p-3" colSpan={2}>
                    <button
                      type="button"
                      onClick={() => void saveTargets()}
                      disabled={working}
                      className="rounded-lg border px-3 py-1.5 text-xs hover:bg-accent disabled:opacity-50"
                    >
                      Save KPI targets
                    </button>
                  </td>
                  <td className="p-3 font-semibold">{liveOverall.toFixed(1)}%</td>
                  <td className="p-3 font-semibold">{liveOverall.toFixed(1)}%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>

      {period ? (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-medium">Saved period: {period.period_start.slice(0, 7)}</p>
              <p className="text-xs text-muted-foreground">
                Status: {period.status} · Stored weighted achievement:{" "}
                {period.overall_achievement_percent.toFixed(1)}%
              </p>
            </div>
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary">
              Commission-ready data foundation
            </span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            This phase stores verified KPI performance and weighted achievement for downstream
            commission logic. It does not invent or calculate commission rates.
          </p>
        </div>
      ) : null}

      <div className="rounded-xl border p-4 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">Current contract template</p>
        <p className="mt-1">
          Loans 30% · Salary Accounts 5% · Other Retail Accounts 5% · Deposits 40% · Mobi 5% ·
          Credit Cards 5% · Insurance 5% · Vooma 5%.
        </p>
        <p className="mt-1">
          Contractual and internal targets are stored separately per KPI, so internal goals can be
          changed without overwriting the contractual baseline. No commission caps, rates or
          eligibility rules are hard-coded.
        </p>
      </div>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Gauge;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-xs uppercase tracking-wide">{label}</span>
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}
