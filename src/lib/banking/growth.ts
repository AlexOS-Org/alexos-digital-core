import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type BankingProfile = {
  id: string;
  user_id: string;
  business_id: string;
  institution_name: string;
  institution_code: string | null;
  role_title: string | null;
  currency: string;
  active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type BankingProduct = {
  id: string;
  user_id: string;
  business_id: string;
  code: string;
  name: string;
  category: string;
  description: string | null;
  target_segment: string | null;
  eligibility_summary: string | null;
  min_amount: number | null;
  max_amount: number | null;
  min_term_months: number | null;
  max_term_months: number | null;
  max_financing_percent: number | null;
  rate_label: string | null;
  source_url: string | null;
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

// Banking tables are newer than the checked-in generated Supabase contract.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export const bankingProfileKey = (businessId: string | null) =>
  ["banking-growth", "profile", businessId] as const;

export const bankingProductsKey = (businessId: string | null) =>
  ["banking-growth", "products", businessId] as const;

export function useBankingProfile(businessId: string | null) {
  return useQuery({
    queryKey: bankingProfileKey(businessId),
    enabled: Boolean(businessId),
    queryFn: async (): Promise<BankingProfile | null> => {
      if (!businessId) return null;
      const { data, error } = await db
        .from("banking_profiles")
        .select("*")
        .eq("business_id", businessId)
        .maybeSingle();
      if (error) throw error;
      return data ?? null;
    },
  });
}

export function useBankingProducts(businessId: string | null, activeOnly = false) {
  return useQuery({
    queryKey: [...bankingProductsKey(businessId), activeOnly],
    enabled: Boolean(businessId),
    queryFn: async (): Promise<BankingProduct[]> => {
      if (!businessId) return [];
      let query = db
        .from("banking_products")
        .select("*")
        .eq("business_id", businessId)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });
      if (activeOnly) query = query.eq("active", true);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSaveBankingProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      business_id: string;
      institution_name: string;
      institution_code?: string | null;
      role_title?: string | null;
      currency?: string;
      active?: boolean;
      notes?: string | null;
    }) => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Not authenticated");

      const { data, error } = await db
        .from("banking_profiles")
        .upsert(
          {
            ...input,
            user_id: auth.user.id,
            currency: input.currency?.trim().toUpperCase() || "KES",
          },
          { onConflict: "business_id" },
        )
        .select()
        .single();

      if (error) throw error;
      return data as BankingProfile;
    },
    onSuccess: (profile) => {
      void queryClient.invalidateQueries({ queryKey: bankingProfileKey(profile.business_id) });
    },
  });
}

export function useCreateBankingProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: Omit<
        BankingProduct,
        "id" | "user_id" | "created_at" | "updated_at"
      >,
    ) => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Not authenticated");

      const { data, error } = await db
        .from("banking_products")
        .insert({ ...input, user_id: auth.user.id })
        .select()
        .single();

      if (error) throw error;
      return data as BankingProduct;
    },
    onSuccess: (product) => {
      void queryClient.invalidateQueries({ queryKey: bankingProductsKey(product.business_id) });
    },
  });
}
