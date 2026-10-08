import { useMemo, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { useBusinessContext } from "@/lib/businesses/context";
import {
  CONTRACT_VERSION,
  scoreBand,
  scoreAchievement,
  weightedScore,
  weeklyTarget,
  monthEndFor,
  monthStartFor,
  weekStartFor,
  useContractFramework,
  type ContractKpi,
  type WeeklyPerformance,
} from "@/lib/banking/contract-performance";
import {
  isTestCustomerSale,
  useCustomerSalesActions,
  type CustomerSaleStatus,
  type QualificationStatus,
} from "@/lib/banking/customer-sales";
import { productOptionsForKpi } from "@/lib/banking/kcb-products";

export const Route = createFileRoute("/_authenticated/banking/performance")({
  component: BankingPerformancePage,
});

function scoreTone(score: number) {
  if (score >= 100) {
    return {
      label: "Target exceeded",
      card: "border-emerald-500/30 bg-emerald-500/[0.06]",
      text: "text-emerald-700 dark:text-emerald-300",
      bar: "bg-emerald-500",
      dot: "bg-emerald-500",
    };
  }
  if (score >= 90) {
    return {
      label: "Full performance",
      card: "border-sky-500/30 bg-sky-500/[0.06]",
      text: "text-sky-700 dark:text-sky-300",
      bar: "bg-sky-500",
      dot: "bg-sky-500",
    };
  }
  if (score >= 75) {
    return {
      label: "Improving",
      card: "border-amber-500/30 bg-amber-500/[0.07]",
      text: "text-amber-700 dark:text-amber-300",
      bar: "bg-amber-500",
      dot: "bg-amber-500",
    };
  }
  return {
    label: "Critical focus",
    card: "border-rose-500/30 bg-rose-500/[0.06]",
    text: "text-rose-700 dark:text-rose-300",
    bar: "bg-rose-500",
    dot: "bg-rose-500",
  };
}

function BankingPerformancePage() {
  const { business } = useBusinessContext();
  const framework = useContractFramework();
  const kpis = framework.data?.kpis ?? [];
  const contract = framework.data?.contract;
  const salesActions = useCustomerSalesActions(contract, kpis);
  const weekStart = weekStartFor();
  const [nextActions, setNextActions] = useState<Record<string, string>>({});
  const [evidenceKpi, setEvidenceKpi] = useState("");
  const [evidenceRef, setEvidenceRef] = useState("");
  const [evidenceType, setEvidenceType] = useState("system record");
  const [planFocus, setPlanFocus] = useState("");
  const [planActions, setPlanActions] = useState("");
  const [planMeasure, setPlanMeasure] = useState("");
  const [saleKpi, setSaleKpi] = useState("");
  const [saleAmount, setSaleAmount] = useState("");
  const [saleScoreValue, setSaleScoreValue] = useState("");
  const [saleToDelete, setSaleToDelete] = useState<
    NonNullable<typeof salesActions.sales.data>[number] | null
  >(null);
  const [confirmDeleteTestEntries, setConfirmDeleteTestEntries] = useState(false);
  const selectedKpi = kpis.find((kpi) => kpi.id === saleKpi);
  const productOptions = productOptionsForKpi(selectedKpi?.code);
  const amountDrivesScore = selectedKpi?.unit.toLowerCase().includes("kes") ?? false;
  const countDrivesScore = Boolean(
    selectedKpi && !amountDrivesScore && !selectedKpi.unit.includes("%"),
  );
  const testSales = (salesActions.sales.data ?? []).filter(isTestCustomerSale);

  const latestByKpi = useMemo(() => {
    const map = new Map<string, WeeklyPerformance>();
    for (const row of framework.weekly.data ?? [])
      if (!map.has(row.kpi_id)) map.set(row.kpi_id, row);
    return map;
  }, [framework.weekly.data]);
  const currentRows = kpis.map((kpi) => ({
    kpi,
    actual: latestByKpi.get(kpi.id)?.actual_value ?? 0,
    qualified: latestByKpi.get(kpi.id)?.qualified_value ?? 0,
    target: weeklyTarget(kpi),
  }));
  const monthStart = monthStartFor();
  const monthEnd = monthEndFor();
  const monthlyRows = kpis.map((kpi) => {
    const qualified = (salesActions.sales.data ?? [])
      .filter(
        (sale) =>
          sale.kpi_id === kpi.id &&
          sale.sale_date >= monthStart &&
          sale.sale_date <= monthEnd &&
          sale.product_status !== "cancelled" &&
          sale.qualification_status === "verified",
      )
      .reduce((sum, sale) => sum + Number(sale.qualified_value), 0);
    return { kpi, qualified, target: kpi.target_value };
  });
  const score = weightedScore(
    currentRows.map((row) => ({
      actual: row.qualified,
      target: row.target,
      weight: row.kpi.weight_percent,
    })),
  );
  const band = scoreBand(score);
  const rollingWeeks = new Set(
    (framework.weekly.data ?? []).slice(0, 13).map((row) => row.week_start),
  );
  const rollingRows = kpis.map((kpi) => {
    const rows = (framework.weekly.data ?? []).filter(
      (row) => row.kpi_id === kpi.id && rollingWeeks.has(row.week_start),
    );
    const target =
      kpi.target_period === "rolling_3_month" ? kpi.target_value : kpi.target_value * 3;
    return { kpi, actual: rows.reduce((sum, row) => sum + row.qualified_value, 0), target };
  });
  const rollingScore = weightedScore(
    rollingRows.map((row) => ({
      actual: row.actual,
      target: row.target,
      weight: row.kpi.weight_percent,
    })),
  );

  const addEvidence = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!contract || !evidenceKpi || !evidenceRef.trim()) return;
    try {
      await framework.addEvidence.mutateAsync({
        contract_id: contract.id,
        kpi_id: evidenceKpi,
        evidence_date: new Date().toISOString().slice(0, 10),
        evidence_type: evidenceType,
        reference_text: evidenceRef.trim(),
        amount: null,
        status: "pending",
        notes: null,
      });
      setEvidenceRef("");
      toast.success("Evidence added for validation");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add evidence");
    }
  };
  const addPlan = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!contract || !planFocus.trim() || !planActions.trim() || !planMeasure.trim()) return;
    try {
      const end = new Date();
      end.setDate(end.getDate() + 60);
      await framework.addPlan.mutateAsync({
        contract_id: contract.id,
        start_date: new Date().toISOString().slice(0, 10),
        end_date: end.toISOString().slice(0, 10),
        status: "active",
        focus_area: planFocus.trim(),
        actions: planActions.trim(),
        success_measure: planMeasure.trim(),
        manager_notes: null,
      });
      setPlanFocus("");
      setPlanActions("");
      setPlanMeasure("");
      toast.success("Improvement plan added");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add improvement plan");
    }
  };
  const addCustomerSale = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!contract || !saleKpi) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const kpi = kpis.find((item) => item.id === saleKpi);
    if (!kpi) return;
    const scoreValue = amountDrivesScore
      ? Number(data.get("amount")) || 0
      : countDrivesScore
        ? Number(data.get("quantity")) || 0
        : Number(data.get("score_value")) || 0;
    const qualifiedValue = countDrivesScore
      ? String(data.get("qualification_status") || "pending") === "verified"
        ? scoreValue
        : 0
      : Number(data.get("qualified_value")) || 0;
    if (qualifiedValue > scoreValue) {
      toast.error("Qualified value cannot be greater than the scorecard value.");
      return;
    }
    try {
      await salesActions.addSale.mutateAsync({
        contract_id: contract.id,
        kpi_id: kpi.id,
        sale_date: String(data.get("sale_date") || new Date().toISOString().slice(0, 10)),
        customer_name: String(data.get("customer_name") || "").trim(),
        customer_reference: String(data.get("customer_reference") || "").trim() || null,
        product_name: String(data.get("product_name") || "").trim(),
        product_status: String(data.get("product_status") || "sold") as CustomerSaleStatus,
        amount: Number(data.get("amount")) || 0,
        quantity: Number(data.get("quantity")) || 1,
        actual_value: scoreValue,
        qualified_value: qualifiedValue,
        qualification_status: String(
          data.get("qualification_status") || "pending",
        ) as QualificationStatus,
        evidence_reference: String(data.get("evidence_reference") || "").trim() || null,
        notes: String(data.get("notes") || "").trim() || null,
      });
      form.reset();
      setSaleKpi("");
      setSaleAmount("");
      setSaleScoreValue("");
      toast.success("Customer sale recorded and weekly scorecard synced");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not record customer sale");
    }
  };
  const downloadReport = () => {
    const report = `# Promotion Readiness Report\n\n**Employee:** ____________________  \n**Contract:** ${contract?.title ?? "KCB Retail Direct Sales Representative"}  \n**Contract version:** ${CONTRACT_VERSION}  \n**Reporting week:** ${weekStart}  \n**Business context:** ${business?.name ?? "Personal KCB performance workspace"}\n\n## Executive score\n\n- Weekly weighted pace: **${score.toFixed(1)}%** — ${band.label}\n- Three-month rolling score: **${rollingScore.toFixed(1)}%**\n- Full-performance threshold: **90%**\n- Target exceeded threshold: **100%**\n\n## Eight-area scorecard\n\n| Area | Weight | Weekly qualified | Weekly target | Achievement | Gap / next action |\n|---|---:|---:|---:|---:|---|\n${currentRows.map((row) => `| ${row.kpi.name} | ${row.kpi.weight_percent}% | ${row.qualified} ${row.kpi.unit} | ${row.target.toFixed(1)} | ${scoreAchievement(row.qualified, row.target).toFixed(1)}% | ${nextActions[row.kpi.id] || row.kpi.improvement_action} |`).join("\n")}\n\n## Evidence submitted\n\n${(framework.evidence.data ?? []).map((item) => `- ${item.evidence_date} — ${item.evidence_type}: ${item.reference_text} (${item.status})`).join("\n") || "- No evidence submitted yet."}\n\n## Strengths\n\n- ______________________________________________\n- ______________________________________________\n\n## Improvement priorities\n\n${
      currentRows
        .filter((row) => row.qualified < row.target)
        .map((row) => `- **${row.kpi.name}:** ${row.kpi.improvement_action}`)
        .join("\n") || "- Maintain target performance and build above-target evidence."
    }\n\n## Promotion discussion\n\n**Promotion case:** ______________________________________________\n\n**Manager comments:** _____________________________________________\n\n**Employee reflection:** ___________________________________________\n`;
    const url = URL.createObjectURL(new Blob([report], { type: "text/markdown" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `promotion-readiness-${weekStart}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  if (framework.isLoading)
    return (
      <div className="mx-auto max-w-7xl p-8 text-sm text-muted-foreground">
        Loading contract framework…
      </div>
    );
  if (framework.error)
    return (
      <div className="mx-auto max-w-7xl rounded-xl border border-destructive/30 p-8 text-sm">
        Could not load the contract framework: {framework.error.message}
      </div>
    );

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-10">
      <header className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6 text-white shadow-2xl shadow-slate-900/10 dark:border-white/10 sm:p-8 lg:flex lg:items-end lg:justify-between">
        <div className="pointer-events-none absolute -right-24 -top-28 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/3 h-56 w-56 rounded-full bg-violet-500/20 blur-3xl" />
        <div>
          <p className="relative text-sm font-semibold tracking-wide text-cyan-300">
            KCB Performance · Contract {CONTRACT_VERSION}
          </p>
          <h1 className="relative mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
            Promotion Readiness Dashboard
          </h1>
          <p className="relative mt-2 max-w-3xl text-sm leading-6 text-slate-300">
            Track the eight contract areas weekly, validate qualifying results, see your three-month
            rolling position, and build evidence for your promotion conversation.
          </p>
        </div>
        <div className="relative mt-2 flex gap-2 lg:mt-0">
          <button
            type="button"
            onClick={() => framework.refresh()}
            className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white backdrop-blur transition hover:bg-white/15"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={downloadReport}
            className="rounded-lg bg-cyan-400 px-3 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-300"
          >
            Download promotion report
          </button>
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Speedometer score={score} band={band.label} />
        <div className="grid gap-3 sm:grid-cols-3">
          <SummaryCard
            label="Weekly weighted pace"
            value={`${score.toFixed(1)}%`}
            hint="90% is the contract full-performance threshold"
            tone={scoreTone(score)}
          />
          <SummaryCard
            label="3-month rolling score"
            value={`${rollingScore.toFixed(1)}%`}
            hint="Use this for promotion evidence and trend review"
            tone={scoreTone(rollingScore)}
          />
          <SummaryCard
            label="Active improvement plans"
            value={(framework.plans.data ?? []).filter((plan) => plan.status === "active").length}
            hint="Keep actions specific and measurable"
            tone={{
              card: "border-violet-500/30 bg-violet-500/[0.06]",
              text: "text-violet-700 dark:text-violet-300",
              bar: "bg-violet-500",
              dot: "bg-violet-500",
            }}
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-card shadow-xl shadow-slate-900/5 dark:border-white/10">
        <div className="flex flex-col gap-3 border-b bg-gradient-to-r from-slate-50 to-indigo-50/70 p-5 dark:from-slate-900/80 dark:to-indigo-950/30 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div>
              <h2 className="font-semibold tracking-tight">Eight-area weekly scorecard</h2>
              <p className="text-xs text-muted-foreground">
                Week beginning {weekStart}. Enter actual and qualified values separately; only
                qualified values earn weighted performance.
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-2 self-start rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 sm:self-auto">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Live · auto-synced
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] text-sm">
            <thead className="border-b bg-slate-950/[0.03] text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground dark:bg-white/[0.03]">
              <tr>
                <th className="p-3">Area</th>
                <th className="p-3">Weight</th>
                <th className="p-3">Target</th>
                <th className="p-3">Actual</th>
                <th className="p-3">Qualified</th>
                <th className="p-3">Weekly achievement</th>
                <th className="p-3">Monthly progress</th>
                <th className="p-3">Gap / next action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {currentRows.map((row) => {
                const achievement = scoreAchievement(row.qualified, row.target);
                const monthly = monthlyRows.find((item) => item.kpi.id === row.kpi.id);
                const monthlyAchievement = monthly
                  ? scoreAchievement(monthly.qualified, monthly.target)
                  : 0;
                const tone = scoreTone(achievement);
                return (
                  <tr
                    key={row.kpi.id}
                    className={`border-l-2 ${tone.card} transition-colors hover:bg-slate-500/[0.04]`}
                  >
                    <td className="p-3">
                      <p className="font-medium">{row.kpi.name}</p>
                      <p className="max-w-[330px] text-xs text-muted-foreground">
                        {row.kpi.qualification_rule}
                      </p>
                    </td>
                    <td className="p-3 font-medium">{row.kpi.weight_percent}%</td>
                    <td className="p-3">
                      {row.target.toFixed(1)}
                      <span className="ml-1 text-xs text-muted-foreground">{row.kpi.unit}/wk</span>
                    </td>
                    <td className="p-3">
                      <input
                        type="text"
                        value={row.actual.toLocaleString()}
                        readOnly
                        aria-label={`${row.kpi.name} actual value`}
                        className="w-28 rounded border bg-muted px-2 py-1.5"
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="text"
                        value={row.qualified.toLocaleString()}
                        readOnly
                        aria-label={`${row.kpi.name} qualified value`}
                        className="w-28 rounded border bg-muted px-2 py-1.5"
                      />
                    </td>
                    <td className="p-3">
                      <div className={`mb-1 flex items-center gap-2 font-semibold ${tone.text}`}>
                        <span className={`h-2 w-2 rounded-full ${tone.dot}`} />
                        {achievement.toFixed(1)}%
                      </div>
                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full ${tone.bar}`}
                          style={{ width: `${Math.min(100, achievement)}%` }}
                        />
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold">{monthlyAchievement.toFixed(1)}%</div>
                      <div className="text-xs text-muted-foreground">
                        {monthly?.qualified.toLocaleString()} / {monthly?.target.toLocaleString()} {row.kpi.unit}
                      </div>
                      <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-indigo-500"
                          style={{ width: `${Math.min(100, monthlyAchievement)}%` }}
                        />
                      </div>
                    </td>
                    <td className="p-3">
                      <input
                        placeholder={row.kpi.improvement_action}
                        value={nextActions[row.kpi.id] ?? ""}
                        onChange={(event) =>
                          setNextActions((current) => ({
                            ...current,
                            [row.kpi.id]: event.target.value,
                          }))
                        }
                        className="mb-1 w-full rounded border bg-background px-2 py-1.5"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="font-semibold">Record a customer product sale</h2>
            <p className="mt-1 max-w-3xl text-xs leading-5 text-muted-foreground">
              Enter what you sold to each customer. The record is linked to one contract area,
              creates a validation record, and automatically recalculates this week&apos;s
              scorecard. Do not enter PINs, account numbers, national ID numbers, or other
              unnecessary sensitive data.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {salesActions.isAdmin ? (
              <button
                type="button"
                disabled={!testSales.length || salesActions.deleteTestEntries.isPending}
                onClick={() => setConfirmDeleteTestEntries(true)}
                className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-rose-300"
              >
                {salesActions.deleteTestEntries.isPending
                  ? "Cleaning testing data…"
                  : `Delete all test entries${testSales.length ? ` (${testSales.length})` : ""}`}
              </button>
            ) : null}
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
              Customer-level source of truth
            </span>
          </div>
        </div>
        <form
          onSubmit={addCustomerSale}
          className="mt-4 grid gap-3 rounded-xl border p-4 md:grid-cols-2 lg:grid-cols-4"
        >
          <select
            required
            value={saleKpi}
            onChange={(event) => setSaleKpi(event.target.value)}
            className="rounded-lg border bg-background px-3 py-2 text-sm"
          >
            <option value="">Contract area</option>
            {kpis.map((kpi) => (
              <option key={kpi.id} value={kpi.id}>
                {kpi.name}
              </option>
            ))}
          </select>
          <input
            name="customer_name"
            required
            placeholder="Customer name"
            className="rounded-lg border bg-background px-3 py-2 text-sm"
          />
          <input
            name="customer_reference"
            placeholder="Safe customer reference (optional)"
            className="rounded-lg border bg-background px-3 py-2 text-sm"
          />
          <select
            key={saleKpi || "no-contract-area"}
            name="product_name"
            required
            defaultValue=""
            className="rounded-lg border bg-background px-3 py-2 text-sm"
          >
            <option value="">Product given to customer</option>
            {productOptions.map((product) => (
              <option key={product} value={product}>
                {product}
              </option>
            ))}
          </select>
          <input
            name="sale_date"
            type="date"
            defaultValue={new Date().toISOString().slice(0, 10)}
            required
            className="rounded-lg border bg-background px-3 py-2 text-sm"
          />
          <select
            name="product_status"
            defaultValue="sold"
            className="rounded-lg border bg-background px-3 py-2 text-sm"
          >
            <option value="lead">Lead</option>
            <option value="application">Application</option>
            <option value="approved">Approved</option>
            <option value="sold">Sold</option>
            <option value="activated">Activated</option>
            <option value="funded">Funded</option>
            <option value="paid">Paid</option>
          </select>
          <input
            name="amount"
            type="number"
            min="0"
            step="any"
            placeholder="Amount (KES), if applicable"
            value={saleAmount}
            onChange={(event) => setSaleAmount(event.target.value)}
            className="rounded-lg border bg-background px-3 py-2 text-sm"
          />
          <input
            name="quantity"
            type="number"
            min="0"
            step="any"
            defaultValue="1"
            placeholder="Quantity"
            className="rounded-lg border bg-background px-3 py-2 text-sm"
          />
          <input
            name="score_value"
            required={!amountDrivesScore && !countDrivesScore}
            type="number"
            min="0"
            step="any"
            placeholder={
              amountDrivesScore
                ? "Auto: amount"
                : countDrivesScore
                  ? "Auto: quantity"
                  : "Scorecard value: %"
            }
            value={amountDrivesScore ? saleAmount : countDrivesScore ? "" : saleScoreValue}
            onChange={(event) => setSaleScoreValue(event.target.value)}
            readOnly={amountDrivesScore || countDrivesScore}
            aria-label={
              amountDrivesScore
                ? "Scorecard value (automatically copied from amount or quantity)"
                : "Scorecard value"
            }
            className="rounded-lg border bg-background px-3 py-2 text-sm"
          />
          <input
            name="qualified_value"
            required={!countDrivesScore}
            type="number"
            min="0"
            step="any"
            defaultValue="0"
            placeholder={countDrivesScore ? "Auto: verified quantity" : "Qualified value"}
            readOnly={countDrivesScore}
            className="rounded-lg border bg-background px-3 py-2 text-sm"
          />
          <select
            name="qualification_status"
            defaultValue="pending"
            className="rounded-lg border bg-background px-3 py-2 text-sm"
          >
            <option value="pending">Pending validation</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </select>
          <input
            name="evidence_reference"
            placeholder="Evidence reference e.g. receipt / application ID"
            className="rounded-lg border bg-background px-3 py-2 text-sm"
          />
          <input
            name="notes"
            placeholder="Notes / next step"
            className="rounded-lg border bg-background px-3 py-2 text-sm md:col-span-2"
          />
          <button
            type="submit"
            disabled={salesActions.addSale.isPending}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            {salesActions.addSale.isPending ? "Saving…" : "Save customer sale"}
          </button>
        </form>
        <p className="mt-3 text-xs text-muted-foreground">
          For KES areas, the amount is the scorecard value. For account, Mobi, and Vooma areas, the
          quantity is used automatically; marking the entry Verified makes that quantity qualified.
          Monthly progress is calculated as qualified results divided by the monthly target, so 1 of
          10 accounts displays 10.0%. Credit cards use the eligible-customer conversion percentage.
        </p>
        <div className="mt-5 overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="border-b bg-muted/30 text-left text-xs text-muted-foreground">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Area / product</th>
                <th className="p-3">Scorecard value</th>
                <th className="p-3">Validation</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(salesActions.sales.data ?? []).map((sale) => (
                <tr key={sale.id}>
                  <td className="p-3 text-xs text-muted-foreground">{sale.sale_date}</td>
                  <td className="p-3 font-medium">{sale.customer_name}</td>
                  <td className="p-3">
                    {kpis.find((kpi) => kpi.id === sale.kpi_id)?.name} · {sale.product_name}
                  </td>
                  <td className="p-3">
                    {sale.actual_value} / {sale.qualified_value}
                  </td>
                  <td className="p-3 capitalize">{sale.qualification_status}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-2">
                      {sale.qualification_status === "pending" ? (
                        <button
                          type="button"
                          onClick={() =>
                            void salesActions.updateQualification.mutateAsync({
                              id: sale.id,
                              qualification_status: "verified",
                              qualified_value: sale.actual_value,
                            })
                          }
                          className="rounded border px-2 py-1 text-xs"
                        >
                          Mark verified
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => setSaleToDelete(sale)}
                        className="rounded border border-rose-500/30 px-2 py-1 text-xs text-rose-700 dark:text-rose-300"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!salesActions.sales.data?.length ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              No customer sales recorded yet.
            </p>
          ) : null}
        </div>

        {saleToDelete ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
            role="presentation"
          >
            <div
              className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-2xl"
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-sale-title"
            >
              <h3 id="delete-sale-title" className="text-lg font-semibold">
                Delete customer sale?
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                This permanently removes the sale, linked evidence, and its recalculated scorecard
                contribution.
              </p>
              <dl className="mt-4 space-y-2 rounded-lg bg-muted/40 p-4 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Customer</dt>
                  <dd className="font-medium text-right">{saleToDelete.customer_name}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Loan amount</dt>
                  <dd className="font-medium text-right">
                    KES {Number(saleToDelete.amount).toLocaleString()}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Date</dt>
                  <dd className="font-medium text-right">{saleToDelete.sale_date}</dd>
                </div>
              </dl>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSaleToDelete(null)}
                  className="rounded-lg border px-3 py-2 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={salesActions.deleteSale.isPending}
                  onClick={async () => {
                    try {
                      await salesActions.deleteSale.mutateAsync(saleToDelete.id);
                      setSaleToDelete(null);
                      toast.success("Sale deleted and scorecard recalculated");
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Could not delete sale");
                    }
                  }}
                  className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {salesActions.deleteSale.isPending ? "Deleting…" : "Delete sale"}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {confirmDeleteTestEntries ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
            role="presentation"
          >
            <div
              className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-2xl"
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-test-title"
            >
              <h3 id="delete-test-title" className="text-lg font-semibold">
                Delete all test entries?
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                This will permanently remove {testSales.length} marked test sale
                {testSales.length === 1 ? "" : "s"}, linked evidence, and affected scorecard
                contributions. Real entries are not included.
              </p>
              <div className="mt-4 max-h-40 overflow-auto rounded-lg bg-muted/40 p-3 text-sm">
                {testSales.map((sale) => (
                  <div key={sale.id}>
                    {sale.customer_name} · KES {Number(sale.amount).toLocaleString()} ·{" "}
                    {sale.sale_date}
                  </div>
                ))}
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteTestEntries(false)}
                  className="rounded-lg border px-3 py-2 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={salesActions.deleteTestEntries.isPending}
                  onClick={async () => {
                    try {
                      const result = await salesActions.deleteTestEntries.mutateAsync();
                      setConfirmDeleteTestEntries(false);
                      toast.success(
                        `${result.deleted_count} test sale${result.deleted_count === 1 ? "" : "s"} deleted and scorecard recalculated`,
                      );
                    } catch (error) {
                      toast.error(
                        error instanceof Error ? error.message : "Could not clean up test entries",
                      );
                    }
                  }}
                  className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {salesActions.deleteTestEntries.isPending ? "Cleaning…" : "Delete test entries"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border bg-card p-5">
          <h2 className="font-semibold">Product qualification rules</h2>
          <div className="mt-4 space-y-3">
            {kpis.map((kpi) => (
              <div key={kpi.id} className="border-b pb-3 last:border-0">
                <p className="font-medium">
                  {kpi.name}{" "}
                  <span className="text-xs text-muted-foreground">
                    ({kpi.target_value.toLocaleString()} {kpi.unit}, {kpi.weight_percent}%)
                  </span>
                </p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {kpi.evidence_required}
                </p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border bg-card p-5">
          <h2 className="font-semibold">Three-month rolling view</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Rolling score: {rollingScore.toFixed(1)}%. Weekly snapshots become the evidence trail
            for your review.
          </p>
          <div className="mt-4 space-y-3">
            {rollingRows.map((row) => (
              <div key={row.kpi.id}>
                <div className="flex justify-between text-xs">
                  <span>{row.kpi.name}</span>
                  <span>
                    {row.actual.toLocaleString()} / {row.target.toLocaleString()} ·{" "}
                    {scoreAchievement(row.actual, row.target).toFixed(1)}%
                  </span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary"
                    style={{ width: `${Math.min(100, scoreAchievement(row.actual, row.target))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border bg-card p-5">
          <h2 className="font-semibold">Evidence and validation</h2>
          <form onSubmit={addEvidence} className="mt-4 grid gap-2 sm:grid-cols-3">
            <select
              required
              value={evidenceKpi}
              onChange={(event) => setEvidenceKpi(event.target.value)}
              className="rounded border bg-background px-2 py-2 text-sm"
            >
              <option value="">Select area</option>
              {kpis.map((kpi) => (
                <option key={kpi.id} value={kpi.id}>
                  {kpi.name}
                </option>
              ))}
            </select>
            <select
              value={evidenceType}
              onChange={(event) => setEvidenceType(event.target.value)}
              className="rounded border bg-background px-2 py-2 text-sm"
            >
              <option>system record</option>
              <option>customer confirmation</option>
              <option>manager validation</option>
              <option>payment confirmation</option>
            </select>
            <input
              required
              value={evidenceRef}
              onChange={(event) => setEvidenceRef(event.target.value)}
              placeholder="Reference / evidence note"
              className="rounded border bg-background px-2 py-2 text-sm sm:col-span-3"
            />
            <button
              type="submit"
              disabled={framework.addEvidence.isPending}
              className="rounded-lg border px-3 py-2 text-sm sm:col-span-3"
            >
              Add evidence for validation
            </button>
          </form>
          <div className="mt-4 space-y-2 text-xs">
            {(framework.evidence.data ?? []).slice(0, 5).map((item) => (
              <div key={item.id} className="rounded border p-2">
                <span className="font-medium">
                  {kpis.find((kpi) => kpi.id === item.kpi_id)?.name}
                </span>{" "}
                · {item.reference_text} · <span className="capitalize">{item.status}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border bg-card p-5">
          <h2 className="font-semibold">Improvement-plan tracker</h2>
          <form onSubmit={addPlan} className="mt-4 space-y-2">
            <input
              required
              value={planFocus}
              onChange={(event) => setPlanFocus(event.target.value)}
              placeholder="Focus area e.g. deposits"
              className="w-full rounded border bg-background px-2 py-2 text-sm"
            />
            <textarea
              required
              value={planActions}
              onChange={(event) => setPlanActions(event.target.value)}
              placeholder="Actions and weekly cadence"
              className="min-h-20 w-full rounded border bg-background px-2 py-2 text-sm"
            />
            <input
              required
              value={planMeasure}
              onChange={(event) => setPlanMeasure(event.target.value)}
              placeholder="Success measure"
              className="w-full rounded border bg-background px-2 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={framework.addPlan.isPending}
              className="rounded-lg border px-3 py-2 text-sm"
            >
              Create 60-day improvement plan
            </button>
          </form>
          <div className="mt-4 space-y-2 text-xs">
            {(framework.plans.data ?? []).map((plan) => (
              <div key={plan.id} className="rounded border p-2">
                <p className="font-medium">
                  {plan.focus_area} · {plan.status}
                </p>
                <p className="mt-1 text-muted-foreground">{plan.success_measure}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 text-sm">
        <p className="font-semibold">Promotion-readiness guidance</p>
        <p className="mt-1 text-muted-foreground">
          Use the downloadable report after each weekly review. A strong case combines a sustained
          score at or above 90%, verified evidence, clear improvement actions for gaps, and
          manager-visible outcomes—not just activity volume.
        </p>
      </div>
    </div>
  );
}

function Speedometer({ score, band }: { score: number; band: string }) {
  const tone = scoreTone(score);
  const bounded = Math.max(0, Math.min(100, score));
  const angle = -135 + bounded * 2.7;
  return (
    <div
      className={`relative overflow-hidden rounded-3xl border bg-card p-5 shadow-xl shadow-slate-900/5 ${tone.card}`}
    >
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        Weighted performance speedometer
      </p>
      <svg
        viewBox="0 0 240 150"
        className="mt-2 w-full"
        role="img"
        aria-label={`${score.toFixed(1)} percent weighted performance`}
      >
        <path
          d="M35 125 A85 85 0 0 1 205 125"
          fill="none"
          stroke="currentColor"
          strokeOpacity=".12"
          strokeWidth="18"
          strokeLinecap="round"
        />
        <path
          d="M35 125 A85 85 0 0 1 205 125"
          fill="none"
          stroke={
            tone.bar.includes("emerald")
              ? "#10b981"
              : tone.bar.includes("sky")
                ? "#0ea5e9"
                : tone.bar.includes("amber")
                  ? "#f59e0b"
                  : "#f43f5e"
          }
          strokeWidth="18"
          strokeLinecap="round"
          pathLength="100"
          strokeDasharray={`${bounded} 100`}
        />
        <line
          x1="120"
          y1="125"
          x2="120"
          y2="55"
          stroke="currentColor"
          strokeWidth="3"
          transform={`rotate(${angle} 120 125)`}
        />
        <circle cx="120" cy="125" r="7" fill="currentColor" />
      </svg>
      <div className="text-center">
        <p className={`text-4xl font-bold tracking-tight ${tone.text}`}>{score.toFixed(1)}%</p>
        <p className={`mt-1 text-sm font-medium ${tone.text}`}>
          {tone.label} · {band}
        </p>
        <p className="mt-3 text-[11px] text-muted-foreground">
          0 critical · 75 improving · 90 full-performance · 100 target
        </p>
      </div>
    </div>
  );
}
function SummaryCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string | number;
  hint: string;
  tone: { card: string; text: string; bar: string; dot: string };
}) {
  return (
    <div
      className={`rounded-3xl border p-5 shadow-xl shadow-slate-900/5 transition-transform hover:-translate-y-0.5 ${tone.card}`}
    >
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-3 text-3xl font-semibold tracking-tight ${tone.text}`}>{value}</p>
      <div className={`mt-4 h-1 w-12 rounded-full ${tone.bar}`} />
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{hint}</p>
    </div>
  );
}
