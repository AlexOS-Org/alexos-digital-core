import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { contractFrameworkKeys } from "@/lib/banking/contract-performance";

// The customer-sales migration is newer than the checked-in generated Supabase types.
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

export function isTestCustomerSale(
  sale: Pick<CustomerSale, "customer_name" | "customer_reference" | "evidence_reference" | "notes">,
) {
  const testWord = /(^|[^a-z])test([^a-z]|$)/i;
  return (
    sale.customer_name === "SAMPLE TEST" ||
    testWord.test(sale.customer_name) ||
    testWord.test(sale.customer_reference ?? "") ||
    testWord.test(sale.evidence_reference ?? "") ||
    testWord.test(sale.notes ?? "")
  );
}

type AtomicSyncResult = {
  sale: CustomerSale;
  week_start: string;
  week_end: string;
};

type AtomicDeleteTestResult = {
  deleted_count: number;
  week_starts: string[];
};

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
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as CustomerSale[];
    },
  });
}

function weekEndFor(weekStart: string) {
  const end = new Date(`${weekStart}T00:00:00Z`);
  end.setUTCDate(end.getUTCDate() + 6);
  return end.toISOString().slice(0, 10);
}

export function weeklySalesTotals(
  sales: CustomerSale[],
  _kpis: Array<{ id: string }>,
  weekStart: string,
) {
  const weekEnd = weekEndFor(weekStart);
  const totals = new Map<string, { actual: number; qualified: number }>();
  for (const sale of sales) {
    if (
      sale.sale_date < weekStart ||
      sale.sale_date > weekEnd ||
      sale.product_status === "cancelled"
    ) {
      continue;
    }
    const current = totals.get(sale.kpi_id) ?? { actual: 0, qualified: 0 };
    current.actual += Number(sale.actual_value);
    if (sale.qualification_status === "verified") {
      current.qualified += Number(sale.qualified_value);
    }
    totals.set(sale.kpi_id, current);
  }
  return totals;
}

export function useCustomerSalesActions(
  contract: { id: string } | null | undefined,
  _kpis: Array<{ id: string }>,
) {
  const queryClient = useQueryClient();
  const contractId = contract?.id ?? null;
  const sales = useCustomerSales(contractId);
  const user = useQuery({
    queryKey: ["authenticated-user"],
    queryFn: async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      return data.user;
    },
  });
  const isAdmin = ["admin", "owner"].includes(String(user.data?.app_metadata?.role ?? ""));
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: customerSalesKey(contractId) });
    void queryClient.invalidateQueries({ queryKey: contractFrameworkKeys.weekly(contractId) });
    void queryClient.invalidateQueries({ queryKey: contractFrameworkKeys.evidence(contractId) });
  };

  const addSale = useMutation({
    mutationFn: async (input: NewCustomerSale) => {
      const { data, error } = await db.rpc("banking_customer_sales_atomic_sync", {
        p_operation: "create",
        p_contract_id: input.contract_id,
        p_kpi_id: input.kpi_id,
        p_sale: {
          sale_date: input.sale_date,
          customer_name: input.customer_name,
          customer_reference: input.customer_reference,
          product_name: input.product_name,
          product_status: input.product_status,
          amount: input.amount,
          quantity: input.quantity,
          actual_value: input.actual_value,
          qualified_value: input.qualified_value,
          qualification_status: input.qualification_status,
          evidence_reference: input.evidence_reference,
          notes: input.notes,
        },
      });
      if (error) throw error;
      return (data as AtomicSyncResult).sale;
    },
    onSuccess: invalidate,
  });

  const updateQualification = useMutation({
    mutationFn: async (input: {
      id: string;
      qualification_status: QualificationStatus;
      qualified_value: number;
    }) => {
      if (!contractId) throw new Error("Contract is not ready");
      const { data, error } = await db.rpc("banking_customer_sales_atomic_sync", {
        p_operation: "qualify",
        p_contract_id: contractId,
        p_sale_id: input.id,
        p_qualification_status: input.qualification_status,
        p_qualified_value: input.qualified_value,
      });
      if (error) throw error;
      return (data as AtomicSyncResult).sale;
    },
    onSuccess: invalidate,
  });

  const updateSale = useMutation({
    mutationFn: async (input: {
      id: string;
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
    }) => {
      if (!contractId) throw new Error("Contract is not ready");
      const { data, error } = await db.rpc("banking_customer_sales_atomic_sync", {
        p_operation: "update",
        p_contract_id: contractId,
        p_kpi_id: input.kpi_id,
        p_sale_id: input.id,
        p_sale: {
          sale_date: input.sale_date,
          customer_name: input.customer_name,
          customer_reference: input.customer_reference,
          product_name: input.product_name,
          product_status: input.product_status,
          amount: input.amount,
          quantity: input.quantity,
          actual_value: input.actual_value,
          qualified_value: input.qualified_value,
          qualification_status: input.qualification_status,
          evidence_reference: input.evidence_reference,
          notes: input.notes,
        },
      });
      if (error) throw error;
      return (data as AtomicSyncResult).sale;
    },
    onSuccess: invalidate,
  });

  const deleteSale = useMutation({
    mutationFn: async (saleId: string) => {
      if (!contractId) throw new Error("Contract is not ready");
      const { data, error } = await db.rpc("banking_customer_sales_atomic_sync", {
        p_operation: "delete",
        p_contract_id: contractId,
        p_sale_id: saleId,
      });
      if (error) throw error;
      return (data as AtomicSyncResult).sale;
    },
    onSuccess: invalidate,
  });

  const deleteTestEntries = useMutation({
    mutationFn: async () => {
      if (!contractId) throw new Error("Contract is not ready");
      if (!isAdmin) throw new Error("Admin role is required for test-entry cleanup");
      const { data, error } = await db.rpc("banking_customer_sales_atomic_sync", {
        p_operation: "delete_test_entries",
        p_contract_id: contractId,
      });
      if (error) throw error;
      return data as AtomicDeleteTestResult;
    },
    onSuccess: invalidate,
  });

  return {
    sales,
    addSale,
    updateSale,
    updateQualification,
    deleteSale,
    deleteTestEntries,
    isAdmin,
  };
}
