import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type {
  Contact,
  ContactFormInput,
} from "@/lib/crm/types";

async function uid() {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  if (!data.user) {
    throw new Error("Not authenticated");
  }

  return data.user.id;
}

export function useContacts() {
  return useQuery({
    queryKey: ["crm", "contacts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .order("display_name", { ascending: true });

      if (error) {
        throw error;
      }

      return (data ?? []) as Contact[];
    },
  });
}

export function useContact(id: string) {
  return useQuery({
    queryKey: ["crm", "contacts", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        throw error;
      }

      return data as Contact;
    },
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ContactFormInput) => {
      const user_id = await uid();

      const payload = {
        ...input,
        user_id,
        type: "person",
        status: input.status ?? "active",
      };

      const { data, error } = await supabase
        .from("contacts")
        .insert(payload)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data as Contact;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["crm", "contacts"],
      });
    },
  });
}

export function useUpdateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<ContactFormInput>;
    }) => {
      const { data, error } = await supabase
        .from("contacts")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data as Contact;
    },

    onSuccess: (contact) => {
      queryClient.invalidateQueries({
        queryKey: ["crm", "contacts"],
      });

      queryClient.setQueryData(
        ["crm", "contacts", contact.id],
        contact,
      );
    },
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("contacts")
        .delete()
        .eq("id", id);

      if (error) {
        throw error;
      }
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["crm", "contacts"],
      });
    },
  });
}