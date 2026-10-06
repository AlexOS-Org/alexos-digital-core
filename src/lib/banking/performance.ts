import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type BankingKpiDefinition = {
  id: string;
  user_id: string;
  business_id: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  weight_percent: number;
  active: boolean;
  sort_order: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type BankingKpiTarget = {
  id: string;
  user_id: string;
  business_id: string;
  kpi_definition_id: string;
  target_scope: "contractual" | "internal";
  period_start: string | null;
  target_value: number;
  source_reference: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type BankingPerformancePeriod = {
  id: string;
  user_id: string;
  business_id: string;
  period_start: string;
  period_end: string;
  status: "open" | "submitted" | "approved";
  overall_achievement_percent: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type BankingKpiPerformance = {
  id: string;
  user_id: string;
  business_id: string;
  performance_period_id: string;
  kpi_definition_id: string;
  target_id: string | null;
  target_scope: "contractual" | "internal";
  target_value: number;
  actual_value: number;
  achievement_percent: number;
  weight_percent: number;
  weighted_contribution: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

// Banking Phase 3 tables are newer than the checked-in generated Supabase contract.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export type BankingKpiTemplate = {
  code: string;
  name: string;
  category: string;
  unit: string;
  weight_percent: number;
  target_value: number;
  notes?: string;
};

export const CONTRACT_KPI_TEMPLATE: BankingKpiTemplate[] = [
{ code: "LOANS", name: "Loans", category: "Lending", unit: "KES", weight_percent: 30, target_value: 2_000_000 },
{ code: "SALARY_ACCOUNTS", name: "Salary Accounts", category: "Accounts", unit: "count", weight_percent: 5, target_value: 10 },
{ code: "OTHER_RETAIL_ACCOUNTS", name: "Other Retail Accounts", category: "Accounts", unit: "count", weight_percent: 5, target_value: 15 },
{ code: "DEPOSITS", name: "Deposits", category: "Liabilities", unit: "KES", weight_percent: 40, target_value: 1_000_000 },
{ code: "MOBI", name: "Mobi", category: "Digital", unit: "count", weight_percent: 5, target_value: 9.6, notes: "Configured as 80% of the specified 12-account monthly target." },
{ code: "CREDIT_CARDS", name: "Credit Cards", category: "Cards", unit: "count", weight_percent: 5, target_value: 0, notes: "Target was not specified in the supplied KPI schedule; configure before use." },
{ code: "INSURANCE", name: "Insurance", category: "Insurance", unit: "KES", weight_percent: 5, target_value: 25_000 },
{ code: "VOOMA", name: "Vooma", category: "Digital", unit: "count", weight_percent: 5, target_value: 10, notes: "Merchants/agents." },
];

export const bankingKpiKeys = {
  definitions: (businessId: string | null) => ["banking-performance", "definitions", businessId] as const,
  targets: (businessId: string | null) => ["banking-performance", "targets", businessId] as const,
  periods: (businessId: string | null) => ["banking-performance", "periods", businessId] as const,
  performance: (periodId: string | null) => ["banking-performance", "performance", periodId] as const,
};

export function calculateKpiAchievement(actual: number, target: number) {
  if (target <= 0) return 0;
  return (Math.max(0, actual) / target) * 100;
}

export function calculateWeightedContribution(achievement: number, weight: number) {
  return (Math.max(0, achievement) * Math.max(0, weight)) / 100;
}

export function calculateOverallAchievement(
  rows: Array<{ actual_value: number; target_value: number; weight_percent: number }>,
) {
  return rows.reduce(
    (sum, row) =>
      sum + calculateWeightedContribution(
        calculateKpiAchievement(row.actual_value, row.target_value),
        row.weight_percent,
      ),
    0,
  );
}

export function useBankingKpiDefinitions(businessId: string | null) {
  return useQuery({
    queryKey: bankingKpiKeys.definitions(businessId),
    enabled: Boolean(businessId),
    queryFn: async (): Promise<BankingKpiDefinition[]> => {
      if (!businessId) return [];
      const { data, error } = await db
        .from("banking_kpi_definitions")
        .select("*")
        .eq("business_id", businessId)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useBankingKpiTargets(businessId: string | null) {
  return useQuery({
    queryKey: bankingKpiKeys.targets(businessId),
    enabled: Boolean(businessId),
    queryFn: async (): Promise<BankingKpiTarget[]> => {
      if (!businessId) return [];
      const { data, error } = await db
        .from("banking_kpi_targets")
        .select("*")
        .eq("business_id", businessId)
        .order("period_start", { ascending: false, nullsFirst: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useBankingPerformancePeriods(businessId: string | null) {
  return useQuery({
    queryKey: bankingKpiKeys.periods(businessId),
    enabled: Boolean(businessId),
    queryFn: async (): Promise<BankingPerformancePeriod[]> => {
      if (!businessId) return [];
      const { data, error } = await db
        .from("banking_performance_periods")
        .select("*")
        .eq("business_id", businessId)
        .order("period_start", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useBankingKpiPerformance(periodId: string | null) {
  return useQuery({
    queryKey: bankingKpiKeys.performance(periodId),
    enabled: Boolean(periodId),
    queryFn: async (): Promise<BankingKpiPerformance[]> => {
      if (!periodId) return [];
      const { data, error } = await db
        .from("banking_kpi_performance")
        .select("*")
        .eq("performance_period_id", periodId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateKpiDefinition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<BankingKpiDefinition, "id" | "user_id" | "created_at" | "updated_at">) => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Not authenticated");
      const { data, error } = await db
        .from("banking_kpi_definitions")
        .insert({ ...input, user_id: auth.user.id })
        .select()
        .single();
      if (error) throw error;
      return data as BankingKpiDefinition;
    },
    onSuccess: (row) => void qc.invalidateQueries({ queryKey: bankingKpiKeys.definitions(row.business_id) }),
  });
}

export async function applyContractKpiTemplate(businessId: string) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Not authenticated");

  const { data: existing, error: existingError } = await db
    .from("banking_kpi_definitions")
    .select("code")
    .eq("business_id", businessId);
  if (existingError) throw existingError;

  const existingCodes = new Set((existing ?? []).map((row: { code: string }) => row.code));
  const definitions = CONTRACT_KPI_TEMPLATE.filter((row) => !existingCodes.has(row.code)).map((row, index) => ({
    user_id: auth.user.id,
    business_id: businessId,
    code: row.code,
    name: row.name,
    category: row.category,
    unit: row.unit,
    weight_percent: row.weight_percent,
    active: true,
    sort_order: index,
    notes: row.notes ?? null,
  }));

  if (!definitions.length) return { inserted: 0, targeted: 0 };

  const { data: created, error } = await db
    .from("banking_kpi_definitions")
    .insert(definitions)
    .select("id, code");
  if (error) throw error;

  const createdByCode = new Map((created ?? []).map((row: { id: string; code: string }) => [row.code, row.id]));
  const targets = CONTRACT_KPI_TEMPLATE
    .filter((row) => createdByCode.has(row.code))
    .map((row) => ({
      user_id: auth.user.id,
      business_id: businessId,
      kpi_definition_id: createdByCode.get(row.code),
      target_scope: "contractual",
      period_start: null,
      target_value: row.target_value,
      source_reference: "Approved Banking Growth KPI schedule",
      notes: row.notes ?? null,
    }));

  const { error: targetError } = await db.from("banking_kpi_targets").insert(targets);
  if (targetError) throw targetError;

  return { inserted: definitions.length, targeted: targets.length };
}

export async function ensurePerformancePeriod(businessId: string, month: string) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Not authenticated");

  const periodStart = `${month}-01`;
  const periodEndDate = new Date(`${month}-01T00:00:00Z`);
  periodEndDate.setUTCMonth(periodEndDate.getUTCMonth() + 1);
  periodEndDate.setUTCDate(0);
  const periodEnd = periodEndDate.toISOString().slice(0, 10);

  const { data: existing, error: findError } = await db
    .from("banking_performance_periods")
    .select("*")
    .eq("business_id", businessId)
    .eq("period_start", periodStart)
    .maybeSingle();
  if (findError) throw findError;
  if (existing) return existing as BankingPerformancePeriod;

  const { data, error } = await db
    .from("banking_performance_periods")
    .insert({
      user_id: auth.user.id,
      business_id: businessId,
      period_start: periodStart,
      period_end: periodEnd,
      status: "open",
      overall_achievement_percent: 0,
    })
    .select()
    .single();
  if (error) throw error;
  return data as BankingPerformancePeriod;
}

export async function savePerformanceSnapshot(
  businessId: string,
  period: BankingPerformancePeriod,
  rows: Array<{
    kpi_definition_id: string;
    target_id?: string | null;
    target_scope: "contractual" | "internal";
    target_value: number;
    actual_value: number;
    weight_percent: number;
    notes?: string | null;
  }>,
) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Not authenticated");
  if (period.status !== "open") throw new Error("This performance period is no longer open for editing.");

  const normalized = rows.map((row) => {
    const achievement = calculateKpiAchievement(row.actual_value, row.target_value);
    return {
      user_id: auth.user.id,
      business_id: businessId,
      performance_period_id: period.id,
      kpi_definition_id: row.kpi_definition_id,
      target_id: row.target_id ?? null,
      target_scope: row.target_scope,
      target_value: row.target_value,
      actual_value: Math.max(0, row.actual_value),
      achievement_percent: achievement,
      weight_percent: row.weight_percent,
      weighted_contribution: calculateWeightedContribution(achievement, row.weight_percent),
      notes: row.notes ?? null,
    };
  });

  const { error: rowError } = await db
    .from("banking_kpi_performance")
    .upsert(normalized, { onConflict: "performance_period_id,kpi_definition_id" });
  if (rowError) throw rowError;

  const overall = calculateOverallAchievement(normalized);
  const { data, error } = await db
    .from("banking_performance_periods")
    .update({ overall_achievement_percent: overall })
    .eq("id", period.id)
    .eq("business_id", businessId)
    .select()
    .single();
  if (error) throw error;
  return data as BankingPerformancePeriod;
}

export async function saveKpiTarget(input: {
  business_id: string;
  kpi_definition_id: string;
  target_scope: "contractual" | "internal";
  target_value: number;
  source_reference?: string | null;
  notes?: string | null;
}) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Not authenticated");
  const { data: existing, error: findError } = await db
    .from("banking_kpi_targets")
    .select("*")
    .eq("business_id", input.business_id)
    .eq("kpi_definition_id", input.kpi_definition_id)
    .eq("target_scope", input.target_scope)
    .is("period_start", null)
    .maybeSingle();
  if (findError) throw findError;

  const payload = {
    user_id: auth.user.id,
    business_id: input.business_id,
    kpi_definition_id: input.kpi_definition_id,
    target_scope: input.target_scope,
    period_start: null,
    target_value: Math.max(0, input.target_value),
    source_reference: input.source_reference ?? null,
    notes: input.notes ?? null,
  };

  if (existing) {
    const { data, error } = await db
      .from("banking_kpi_targets")
      .update(payload)
      .eq("id", existing.id)
      .eq("business_id", input.business_id)
      .select()
      .single();
    if (error) throw error;
    return data as BankingKpiTarget;
  }

  const { data, error } = await db
    .from("banking_kpi_targets")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as BankingKpiTarget;
}
