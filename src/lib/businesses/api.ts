import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Business } from "./types";

const BUSINESSES_KEY = ["businesses"] as const;
const BUSINESS_KEY = (slug: string) => ["businesses", slug] as const;

const BUSINESS_COLUMNS =
  "id,user_id,name,slug,business_type,status,description,logo_url,cover_image_url,currency,created_at,updated_at,hostname";

export function useBusinesses() {
  return useQuery({
    queryKey: BUSINESSES_KEY,
    queryFn: async (): Promise<Business[]> => {
      const { data, error } = await supabase.from("businesses").select(BUSINESS_COLUMNS);
      if (error) throw error;
      return (data ?? []) as unknown as Business[];
    },
    retry: false,
  });
}

export function useCreateBusiness() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; business_type?: string | null }) => {
      const name = input.name.trim();
      if (!name) throw new Error("Enter a business name.");
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("You must be signed in to create a business workspace.");
      const slug =
        name
          .toLowerCase()
          .normalize("NFKD")
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/[\s-]+/g, "-")
          .replace(/^-+|-+$/g, "") || "business";
      const { data, error } = await supabase
        .from("businesses")
        .insert({
          user_id: auth.user.id,
          name,
          slug,
          business_type: input.business_type ?? "service",
          status: "active",
          currency: "KES",
        })
        .select(BUSINESS_COLUMNS)
        .single();
      if (error) throw error;
      return data as unknown as Business;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: BUSINESSES_KEY });
    },
  });
}

export function useBusiness(slug: string | undefined) {
  return useQuery({
    queryKey: BUSINESS_KEY(slug ?? "none"),
    enabled: !!slug,
    queryFn: async (): Promise<Business | null> => {
      const { data, error } = await supabase
        .from("businesses")
        .select(BUSINESS_COLUMNS)
        .eq("slug", slug!)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as unknown as Business | null;
    },
    retry: false,
  });
}

export function useUpdateBusiness() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      name?: string;
      business_type?: string | null;
      logo_url?: string | null;
      cover_image_url?: string | null;
      description?: string | null;
      status?: string;
      hostname?: string | null;
    }) => {
      const updatePayload: Record<string, unknown> = {
        name: input.name,
        business_type: input.business_type,
        logo_url: input.logo_url,
        cover_image_url: input.cover_image_url,
        description: input.description,
        status: input.status,
      };
      if (input.hostname !== undefined) {
        updatePayload.hostname = input.hostname;
      }
      const { error } = await supabase
        .from("businesses")
        .update(updatePayload as never)
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: BUSINESSES_KEY });
    },
  });
}
