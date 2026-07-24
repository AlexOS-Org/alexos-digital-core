import { supabase } from "@/integrations/supabase/client";

export async function getContacts() {
  const { data, error } = await supabase.from("contacts").select("*").order("display_name");

  if (error) throw error;

  return data;
}

export async function getContact(id: string) {
  const { data, error } = await supabase.from("contacts").select("*").eq("id", id).single();

  if (error) throw error;

  return data;
}

export async function createContact(contact: {
  display_name: string;
  email?: string;
  phone?: string;
  source?: string;
  status?: string;
  notes?: string;
  user_id: string;
}) {
  const { data, error } = await supabase.from("contacts").insert(contact).select().single();

  if (error) throw error;

  return data;
}

export async function updateContact(
  id: string,
  updates: Partial<{
    display_name: string;
    email: string;
    phone: string;
    source: string;
    status: string;
    notes: string;
  }>,
) {
  const { data, error } = await supabase
    .from("contacts")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function deleteContact(id: string) {
  const { error } = await supabase.from("contacts").delete().eq("id", id);

  if (error) throw error;
}
