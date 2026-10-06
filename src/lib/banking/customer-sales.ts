import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  contractFrameworkKeys,
  scoreAchievement,
  weightedContribution,
  type ContractKpi,
  type PerformanceContract,
} from "@/lib/banking/contract-performance";

// Delivered by the customer sales migration before generated Supabase types refresh.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export type CustomerSaleStatus =
  | "lead"
  | "application"
  | "approved"
  | "sold"
  | "activated"
  | "funded"
  | "paid"
  | "rejected"
  | "cancelled";
export type QualificationStatus = "pending" | "verified" | "rejected";
export type CustomerSale = {
  id: string;
  user_id: string;
  contract_id: string;
  kpi_id: string;
  sale_date: string;
  customer_name: string;
  customer_reference: string | null;
  product_name: string;
  product_status: CustomerSaleStatus;
  amount: number;
  quantity: number;
  actual_value: number;
  qualified_value: number;
  qualification_status: QualificationStatus;
  evidence_reference: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};
export type NewCustomerSale = Omit<CustomerSale, "id" | "user_id" | "created_at" | "updated_at">;

export const customerSalesKey = (contractId: string | null) =>
  ["kcb-contract-framework", "customer-sales", contractId] as const;

export function useCustomerSales(contractId: string | null) {
  return useQuery({
    queryKey: customerSalesKey(contractId),
    enabled: Boolean(contractId),
    queryFn: async () => {
      const { data, error } = await db
        .from("banking_customer_sales")
        .select("*")
        .eq("contract_id", contractId)
        .order("sale_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(250);
      if (error) throw error;
      return (data ?? []) as CustomerSale[];
    },
  });
}

export function weeklySalesTotals(sales: CustomerSale[], kpis: ContractKpi[], weekStart: string) {
  const kpiById = new Map(kpis.map((kpi) => [kpi.id, kpi]));
  const totals = new Map<string, { actual: number; qualified: number }>();
  for (const sale of sales) {
    if (sale.sale_date < weekStart || sale.product_status === "cancelled") continue;
    const current = totals.get(sale.kpi_id) ?? { actual: 0, qualified: 0 };
    const kpi = kpiById.get(sale.kpi_id);
    current.actual += sale.actual_value;
    if (sale.qualification_status === "verified") current.qualified += sale.qualified_value;
    totals.set(sale.kpi_id, current);
    if (!kpi) continue;
  }
  return totals;
}

export async function syncWeeklyScorecardFromSales(
  contract: PerformanceContract,
  kpis: ContractKpi[],
  sales: CustomerSale[],
  weekStart: string,
) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Not authenticated");
  const totals = weeklySalesTotals(sales, kpis, weekStart);
  const rows = kpis.map((kpi) => {
    const total = totals.get(kpi.id) ?? { actual: 0, qualified: 0 };
    const target = kpi.target_period === "weekly" ? kpi.target_value : kpi.target_value / 4.33;
    const achievement = scoreAchievement(total.qualified, target);
    return {
      contract_id: contract.id,
      kpi_id: kpi.id,
      user_id: auth.user!.id,
      week_start: weekStart,
      actual_value: total.actual,
      qualified_value: total.qualified,
      target_value: target,
      achievement_percent: achievement,
      weighted_contribution: weightedContribution(total.qualified, target, kpi.weight_percent),
      blockers: null,
      next_action: kpi.improvement_action,
      manager_note: null,
    };
  });
  const { error } = await db.from("banking_weekly_performance").upsert(rows, {
    onConflict: "contract_id,kpi_id,week_start",
  });
  if (error) throw error;
  return rows;
}

export function useCustomerSalesActions(
  contract: PerformanceContract | null | undefined,
  kpis: ContractKpi[],
) {
  const queryClient = useQueryClient();
  const contractId = contract?.id ?? null;
  const sales = useCustomerSales(contractId);
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: customerSalesKey(contractId) });
    void queryClient.invalidateQueries({ queryKey: contractFrameworkKeys.weekly(contractId) });
    void queryClient.invalidateQueries({ queryKey: contractFrameworkKeys.evidence(contractId) });
  };
  const addSale = useMutation({
    mutationFn: async (input: NewCustomerSale) => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Not authenticated");
      const { data, error } = await db
        .from("banking_customer_sales")
        .insert({ ...input, user_id: auth.user.id })
        .select()
        .single();
      if (error) throw error;
      const sale = data as CustomerSale;
      const kpi = kpis.find((item) => item.id === sale.kpi_id);
      if (kpi) {
        const { error: evidenceError } = await db.from("banking_performance_evidence").insert({
          source_sale_id: sale.id,
          contract_id: sale.contract_id,
          kpi_id: sale.kpi_id,
          user_id: auth.user.id,
          evidence_date: sale.sale_date,
          evidence_type: "customer sale record",
          reference_text: `${sale.customer_name} — ${sale.product_name}: ${sale.evidence_reference ?? "Customer sale ledger record"}`,
          amount: sale.amount,
          status: sale.qualification_status === "verified" ? "verified" : "pending",
          notes: sale.notes,
        });
        if (evidenceError) throw evidenceError;
      }
      const { data: allSales, error: readError } = await db
        .from("banking_customer_sales")
        .select("*")
        .eq("contract_id", sale.contract_id)
        .limit(250);
      if (readError) throw readError;
      const weekStart = new Date(`${sale.sale_date}T00:00:00Z`);
      const day = weekStart.getUTCDay();
      weekStart.setUTCDate(weekStart.getUTCDate() - (day === 0 ? 6 : day - 1));
      await syncWeeklyScorecardFromSales(
        saleContract(contractId, sale),
        kpis,
        allSales as CustomerSale[],
        weekStart.toISOString().slice(0, 10),
      );
      return sale;
    },
    onSuccess: invalidate,
  });
  const updateQualification = useMutation({
    mutationFn: async (input: {
      id: string;
      qualification_status: QualificationStatus;
      qualified_value: number;
    }) => {
      const { data, error } = await db
        .from("banking_customer_sales")
        .update(input)
        .eq("id", input.id)
        .select()
        .single();
      if (error) throw error;
      const sale = data as CustomerSale;
      const { data: allSales, error: readError } = await db
        .from("banking_customer_sales")
        .select("*")
        .eq("contract_id", sale.contract_id)
        .limit(250);
      if (readError) throw readError;
      const { error: evidenceError } = await db
        .from("banking_performance_evidence")
        .update({
          status: sale.qualification_status,
          amount: sale.amount,
          notes: sale.notes,
        })
        .eq("source_sale_id", sale.id);
      if (evidenceError) throw evidenceError;
      const date = new Date(`${sale.sale_date}T00:00:00Z`);
      const day = date.getUTCDay();
      date.setUTCDate(date.getUTCDate() - (day === 0 ? 6 : day - 1));
      await syncWeeklyScorecardFromSales(
        saleContract(contractId, sale),
        kpis,
        allSales as CustomerSale[],
        date.toISOString().slice(0, 10),
      );
      return sale;
    },
    onSuccess: invalidate,
  });
  return { sales, addSale, updateQualification };
}

function saleContract(contractId: string | null, sale: CustomerSale): PerformanceContract {
  if (!contractId) throw new Error("Contract is not ready");
  return {
    id: contractId,
    user_id: sale.user_id,
    contract_version: "2026-09-30",
    effective_date: "2026-09-30",
    title: "KCB Retail Direct Sales Representative Performance Contract",
    status: "active",
  };
}
