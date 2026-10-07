import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// These tables are introduced by the contract framework migration before generated types refresh.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export type ContractKpi = {
  id: string;
  contract_id: string;
  user_id: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  weight_percent: number;
  target_value: number;
  target_period: "weekly" | "monthly" | "rolling_3_month";
  qualification_rule: string;
  evidence_required: string;
  improvement_action: string;
  sort_order: number;
  active: boolean;
};
export type PerformanceContract = {
  id: string;
  user_id: string;
  contract_version: string;
  effective_date: string;
  title: string;
  status: "draft" | "active" | "archived";
};
export type WeeklyPerformance = {
  id: string;
  contract_id: string;
  kpi_id: string;
  user_id: string;
  week_start: string;
  actual_value: number;
  qualified_value: number;
  target_value: number;
  achievement_percent: number;
  weighted_contribution: number;
  blockers: string | null;
  next_action: string | null;
  manager_note: string | null;
};
export type PerformanceEvidence = {
  id: string;
  contract_id: string;
  kpi_id: string;
  user_id: string;
  evidence_date: string;
  evidence_type: string;
  reference_text: string;
  amount: number | null;
  status: "pending" | "verified" | "rejected";
  notes: string | null;
};
export type ImprovementPlan = {
  id: string;
  contract_id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  status: "draft" | "active" | "completed" | "cancelled";
  focus_area: string;
  actions: string;
  success_measure: string;
  manager_notes: string | null;
};

export const CONTRACT_VERSION = "2026-09-30";
export const CONTRACT_TITLE = "KCB Retail Direct Sales Representative Performance Contract";

export const CONTRACT_KPIS = [
  {
    code: "LOANS",
    name: "Loans",
    category: "Lending",
    unit: "KES",
    weight_percent: 30,
    target_value: 2_000_000,
    target_period: "monthly" as const,
    qualification_rule:
      "Qualifying personal/Sahi loan drawdown; other loan types count after the primary loan target is achieved. Mortgage commission requires a loan above KES 5M and appraisal fees paid.",
    evidence_required:
      "Validated loan drawdown, customer, product, and appraisal-fee evidence where applicable.",
    improvement_action:
      "Build a weekly qualified loan pipeline and focus first on personal/Sahi loans.",
  },
  {
    code: "SALARY_ACCOUNTS",
    name: "Salary Accounts",
    category: "Accounts",
    unit: "accounts",
    weight_percent: 5,
    target_value: 10,
    target_period: "monthly" as const,
    qualification_rule:
      "Funded, live and active salary accounts; cumulative revenue must reach at least KES 300 by the end of the three-month period.",
    evidence_required:
      "Account opening, funding, active status, and three-month revenue confirmation.",
    improvement_action:
      "Follow every account through funding and activation instead of counting openings alone.",
  },
  {
    code: "OTHER_RETAIL_ACCOUNTS",
    name: "Other Retail Accounts",
    category: "Accounts",
    unit: "accounts",
    weight_percent: 5,
    target_value: 15,
    target_period: "monthly" as const,
    qualification_rule:
      "Funded active accounts with at least KES 1,000; applicable Biashara Club membership fee must be paid.",
    evidence_required:
      "Account category, funding amount, active status, and membership-fee confirmation.",
    improvement_action:
      "Prioritize funded, active segments and track activation within the first week.",
  },
  {
    code: "DEPOSITS",
    name: "Deposits",
    category: "Liabilities",
    unit: "KES",
    weight_percent: 40,
    target_value: 1_000_000,
    target_period: "rolling_3_month" as const,
    qualification_rule:
      "Average deposit measured for three months from account opening; internal transfers excluded.",
    evidence_required:
      "Customer-level deposit balances, source classification, and three-month average validation.",
    improvement_action:
      "Develop a deposit pipeline with expected balance, source, retention plan, and weekly follow-up.",
  },
  {
    code: "MOBI",
    name: "Mobi",
    category: "Digital",
    unit: "qualified accounts",
    weight_percent: 5,
    target_value: 10,
    target_period: "monthly" as const,
    qualification_rule:
      "Practical target is 10 qualified accounts from the contract's 80% of 12-account target; every customer must complete at least two successful financial transactions.",
    evidence_required: "New-to-bank/customer record and two successful transaction confirmations.",
    improvement_action:
      "Onboard fewer but fully activated customers and schedule a second-transaction follow-up.",
  },
  {
    code: "CREDIT_CARDS",
    name: "Credit Cards",
    category: "Cards",
    unit: "% eligible customers",
    weight_percent: 5,
    target_value: 80,
    target_period: "monthly" as const,
    qualification_rule:
      "At least 80% of eligible new customers earning the required net pay must have an approved and collected/activated card.",
    evidence_required:
      "Eligibility, net-pay band, approval, collection/activation, and product type.",
    improvement_action:
      "Pre-screen eligibility and track each application from approval to collection.",
  },
  {
    code: "INSURANCE",
    name: "Insurance",
    category: "Insurance",
    unit: "KES premium",
    weight_percent: 5,
    target_value: 25_000,
    target_period: "monthly" as const,
    qualification_rule: "Premium counts when received, not merely quoted or submitted.",
    evidence_required: "Policy reference and premium receipt confirmation.",
    improvement_action:
      "Prioritize customers with clear protection needs and follow through to paid premium.",
  },
  {
    code: "VOOMA",
    name: "Vooma Merchants/Agents",
    category: "Digital",
    unit: "active merchants/agents",
    weight_percent: 5,
    target_value: 10,
    target_period: "monthly" as const,
    qualification_rule:
      "Ten merchants/agents or a combination; active account requires at least KES 1,000 in transactions. After three months, recruitment contributes 70% and activeness 30%.",
    evidence_required:
      "Merchant/agent type, recruitment date, active status, and transaction amount.",
    improvement_action:
      "Track both recruitment and activation so the three-month 70/30 mix is visible.",
  },
] as const;

export function scoreAchievement(actual: number, target: number) {
  if (target <= 0) return 0;
  return Math.max(0, actual / target) * 100;
}
export function weightedContribution(actual: number, target: number, weight: number) {
  return (Math.min(100, scoreAchievement(actual, target)) * weight) / 100;
}
export function scoreBand(score: number) {
  if (score >= 100) return { label: "Target exceeded", tone: "excellent" as const };
  if (score >= 90) return { label: "Full-performance range", tone: "on-track" as const };
  if (score >= 75) return { label: "Improving — below 90%", tone: "watch" as const };
  return { label: "Critical improvement focus", tone: "critical" as const };
}
export function weightedScore(rows: Array<{ actual: number; target: number; weight: number }>) {
  return rows.reduce(
    (sum, row) => sum + weightedContribution(row.actual, row.target, row.weight),
    0,
  );
}
export function weekStartFor(date = new Date()) {
  const result = new Date(date);
  const day = result.getDay();
  result.setDate(result.getDate() - (day === 0 ? 6 : day - 1));
  return result.toISOString().slice(0, 10);
}
export function weeklyTarget(kpi: Pick<ContractKpi, "target_value" | "target_period">) {
  if (kpi.target_period === "weekly") return kpi.target_value;
  if (kpi.target_period === "rolling_3_month") return kpi.target_value / 13;
  return kpi.target_value / 4.33;
}

export const contractFrameworkKeys = {
  contract: ["kcb-contract-framework", "contract"] as const,
  weekly: (contractId: string | null) => ["kcb-contract-framework", "weekly", contractId] as const,
  evidence: (contractId: string | null) =>
    ["kcb-contract-framework", "evidence", contractId] as const,
  plans: (contractId: string | null) => ["kcb-contract-framework", "plans", contractId] as const,
};

export function useContractFramework() {
  const queryClient = useQueryClient();
  const contract = useQuery({
    queryKey: contractFrameworkKeys.contract,
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return null;
      const { data: existing, error } = await db
        .from("banking_performance_contracts")
        .select("*")
        .eq("user_id", auth.user.id)
        .eq("contract_version", CONTRACT_VERSION)
        .maybeSingle();
      if (error) throw error;
      let current = existing as PerformanceContract | null;
      if (!current) {
        const { data: created, error: createError } = await db
          .from("banking_performance_contracts")
          .insert({
            user_id: auth.user.id,
            contract_version: CONTRACT_VERSION,
            effective_date: CONTRACT_VERSION,
            title: CONTRACT_TITLE,
            status: "active",
          })
          .select()
          .single();
        if (createError) throw createError;
        current = created as PerformanceContract;
        const { error: kpiError } = await db.from("banking_contract_kpis").insert(
          CONTRACT_KPIS.map((kpi, index) => ({
            ...kpi,
            contract_id: current!.id,
            user_id: auth.user!.id,
            sort_order: index,
            active: true,
          })),
        );
        if (kpiError) throw kpiError;
      }
      const { data: kpis, error: kpiReadError } = await db
        .from("banking_contract_kpis")
        .select("*")
        .eq("contract_id", current.id)
        .eq("user_id", auth.user.id)
        .order("sort_order");
      if (kpiReadError) throw kpiReadError;
      return { contract: current, kpis: (kpis ?? []) as ContractKpi[] };
    },
  });
  const contractId = contract.data?.contract.id ?? null;
  const weekly = useQuery({
    queryKey: contractFrameworkKeys.weekly(contractId),
    enabled: Boolean(contractId),
    queryFn: async () => {
      const { data, error } = await db
        .from("banking_weekly_performance")
        .select("*")
        .eq("contract_id", contractId)
        .order("week_start", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as WeeklyPerformance[];
    },
  });
  const evidence = useQuery({
    queryKey: contractFrameworkKeys.evidence(contractId),
    enabled: Boolean(contractId),
    queryFn: async () => {
      const { data, error } = await db
        .from("banking_performance_evidence")
        .select("*")
        .eq("contract_id", contractId)
        .order("evidence_date", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as PerformanceEvidence[];
    },
  });
  const plans = useQuery({
    queryKey: contractFrameworkKeys.plans(contractId),
    enabled: Boolean(contractId),
    queryFn: async () => {
      const { data, error } = await db
        .from("banking_improvement_plans")
        .select("*")
        .eq("contract_id", contractId)
        .order("end_date", { ascending: true })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as ImprovementPlan[];
    },
  });
  const refresh = () =>
    void Promise.all([contract.refetch(), weekly.refetch(), evidence.refetch(), plans.refetch()]);
  const recordWeekly = useMutation({
    mutationFn: async (
      input: Omit<
        WeeklyPerformance,
        | "id"
        | "user_id"
        | "created_at"
        | "updated_at"
        | "achievement_percent"
        | "weighted_contribution"
      >,
    ) => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Not authenticated");
      const achievement = scoreAchievement(input.qualified_value, input.target_value);
      const { data, error } = await db
        .from("banking_weekly_performance")
        .upsert(
          {
            ...input,
            user_id: auth.user.id,
            achievement_percent: achievement,
            weighted_contribution: weightedContribution(
              input.qualified_value,
              input.target_value,
              contract.data?.kpis.find((k) => k.id === input.kpi_id)?.weight_percent ?? 0,
            ),
          },
          { onConflict: "contract_id,kpi_id,week_start" },
        )
        .select()
        .single();
      if (error) throw error;
      return data as WeeklyPerformance;
    },
    onSuccess: refresh,
  });
  const addEvidence = useMutation({
    mutationFn: async (
      input: Omit<PerformanceEvidence, "id" | "user_id" | "created_at" | "updated_at">,
    ) => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Not authenticated");
      const { data, error } = await db
        .from("banking_performance_evidence")
        .insert({ ...input, user_id: auth.user.id })
        .select()
        .single();
      if (error) throw error;
      return data as PerformanceEvidence;
    },
    onSuccess: refresh,
  });
  const addPlan = useMutation({
    mutationFn: async (
      input: Omit<ImprovementPlan, "id" | "user_id" | "created_at" | "updated_at">,
    ) => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Not authenticated");
      const { data, error } = await db
        .from("banking_improvement_plans")
        .insert({ ...input, user_id: auth.user.id })
        .select()
        .single();
      if (error) throw error;
      return data as ImprovementPlan;
    },
    onSuccess: refresh,
  });
  return {
    ...contract,
    weekly,
    evidence,
    plans,
    recordWeekly,
    addEvidence,
    addPlan,
    refresh,
    queryClient,
  };
}
