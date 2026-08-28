import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type BankingEmployer = {
  id: string;
  user_id: string;
  company_name: string;
  industry: string | null;
  location: string | null;
  employee_count: number | null;
  recruitment_frequency: "unknown" | "occasional" | "regular" | "frequent" | "mass";
  hiring_momentum_score: number;
  priority: "low" | "medium" | "high" | "hot";
  hr_contact_name: string | null;
  hr_contact_phone: string | null;
  hr_contact_email: string | null;
  notes: string | null;
  last_hiring_signal_at: string | null;
  created_at: string;
  updated_at: string;
};

export type BankingSignal = {
  id: string;
  employer_id: string;
  signal_type: string;
  title: string;
  source_url: string | null;
  detected_at: string;
  vacancy_count: number;
  estimated_hires: number;
  status: "new" | "reviewed" | "actioned" | "dismissed";
  notes: string | null;
};

export type BankingProspect = {
  id: string;
  employer_id: string;
  crm_contact_id: string | null;
  first_name: string;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  job_title: string | null;
  estimated_salary: number | null;
  stage:
    | "identified"
    | "contacted"
    | "account_opened"
    | "salary_active"
    | "product_opportunity"
    | "converted"
    | "lost";
  account_status: "not_started" | "application" | "opened" | "active";
  consent_status: "unknown" | "pending" | "granted" | "declined";
  next_action_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

// The generated Supabase Database type is intentionally not modified in this first isolated slice.
// The cast keeps this module self-contained until the next type-generation pass.
// Banking tables are delivered by a migration newer than the checked-in generated types.
// Keep the cast local until the next type-generation pass adds those tables.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export const bankingEmployersKey = ["banking", "employers"] as const;
export const bankingSignalsKey = ["banking", "signals"] as const;
export const bankingProspectsKey = ["banking", "prospects"] as const;

export function useBankingEmployers() {
  return useQuery({
    queryKey: bankingEmployersKey,
    queryFn: async (): Promise<BankingEmployer[]> => {
      const { data, error } = await db
        .from("banking_employers")
        .select("*")
        .order("hiring_momentum_score", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useBankingSignals() {
  return useQuery({
    queryKey: bankingSignalsKey,
    queryFn: async (): Promise<BankingSignal[]> => {
      const { data, error } = await db
        .from("banking_recruitment_signals")
        .select("*")
        .neq("status", "dismissed")
        .order("detected_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useBankingProspects() {
  return useQuery({
    queryKey: bankingProspectsKey,
    queryFn: async (): Promise<BankingProspect[]> => {
      const { data, error } = await db
        .from("banking_employee_prospects")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateBankingEmployer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: Pick<
        BankingEmployer,
        | "company_name"
        | "industry"
        | "location"
        | "employee_count"
        | "recruitment_frequency"
        | "hiring_momentum_score"
        | "priority"
        | "hr_contact_name"
        | "hr_contact_phone"
        | "hr_contact_email"
        | "notes"
      >,
    ) => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Not authenticated");
      const { data, error } = await db
        .from("banking_employers")
        .insert({ ...input, user_id: auth.user.id })
        .select()
        .single();
      if (error) throw error;
      return data as BankingEmployer;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: bankingEmployersKey }),
  });
}

export function useCreateBankingProspect() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: Omit<BankingProspect, "id" | "user_id" | "created_at" | "updated_at">,
    ) => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Not authenticated");
      const { data, error } = await db
        .from("banking_employee_prospects")
        .insert({ ...input, user_id: auth.user.id })
        .select()
        .single();
      if (error) throw error;
      return data as BankingProspect;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: bankingProspectsKey }),
  });
}

export async function createCrmContactFromBankingProspect(prospect: BankingProspect) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Not authenticated");
  const { data, error } = await db
    .from("contacts")
    .insert({
      user_id: auth.user.id,
      first_name: prospect.first_name.trim(),
      last_name: prospect.last_name?.trim() || null,
      display_name: [prospect.first_name, prospect.last_name].filter(Boolean).join(" "),
      email: prospect.email?.trim() || null,
      phone: prospect.phone?.trim() || null,
      company: null,
      job_title: prospect.job_title?.trim() || null,
      source: "banking-acquisition",
      status: "lead",
      notes: prospect.notes?.trim() || "Banking acquisition prospect",
      tags: ["banking", "salary-acquisition"],
    })
    .select()
    .single();
  if (error) throw error;
  const { error: linkError } = await db
    .from("banking_employee_prospects")
    .update({ crm_contact_id: data.id })
    .eq("id", prospect.id);
  if (linkError) throw linkError;
  return data;
}
