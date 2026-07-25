import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type {
  Contact,
  ContactInput,
  ContactStatus,
  CrmActivity,
  CrmActivityType,
  CrmAttachment,
  CrmNote,
  CrmTask,
  CrmTaskStatus,
  Lead,
  LeadInput,
  LeadStage,
  LeadStageHistory,
} from "./types";

async function getUserId(): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Not authenticated");
  return user.id;
}

// ============ CONTACTS ============

export const contactsKey = ["crm", "contacts"] as const;
export const contactKey = (id: string) => ["crm", "contact", id] as const;

export function useContacts(params?: { search?: string; status?: ContactStatus | "all" }) {
  const search = params?.search?.trim() ?? "";
  const status = params?.status ?? "all";
  return useQuery({
    queryKey: [...contactsKey, { search, status }],
    queryFn: async (): Promise<Contact[]> => {
      let q = supabase
        .from("contacts")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (status !== "all") q = q.eq("status", status);
      if (search) {
        q = q.or(
          [
            `first_name.ilike.%${search}%`,
            `last_name.ilike.%${search}%`,
            `email.ilike.%${search}%`,
            `company.ilike.%${search}%`,
            `phone.ilike.%${search}%`,
          ].join(","),
        );
      }
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useContact(id: string | undefined) {
  return useQuery({
    queryKey: contactKey(id ?? "none"),
    enabled: !!id,
    queryFn: async (): Promise<Contact | null> => {
      const { data, error } = await supabase.from("contacts").select("*").eq("id", id!).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useSaveContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ContactInput): Promise<Contact> => {
      const user_id = await getUserId();
      const payload = {
        user_id,
        first_name: input.first_name.trim(),
        last_name: input.last_name?.trim() || null,
        email: input.email?.trim() || null,
        phone: input.phone?.trim() || null,
        company: input.company?.trim() || null,
        job_title: input.job_title?.trim() || null,
        source: input.source?.trim() || null,
        status: (input.status ?? "lead") as ContactStatus,
        notes: input.notes?.trim() || null,
        tags: input.tags ?? [],
      };
      if (input.id) {
        const { data, error } = await supabase
          .from("contacts")
          .update(payload)
          .eq("id", input.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase.from("contacts").insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data, vars) => {
      qc.invalidateQueries({ queryKey: contactsKey });
      if (vars.id) qc.invalidateQueries({ queryKey: contactKey(vars.id) });
      toast.success(vars.id ? "Contact updated" : "Contact created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("contacts")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: contactsKey });
      toast.success("Contact deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ============ LEADS ============

export const leadsKey = ["crm", "leads"] as const;
export const leadKey = (id: string) => ["crm", "lead", id] as const;

export function useLeads(params?: { contactId?: string }) {
  const contactId = params?.contactId;
  return useQuery({
    queryKey: [...leadsKey, { contactId: contactId ?? null }],
    queryFn: async (): Promise<Lead[]> => {
      let q = supabase
        .from("leads")
        .select("*")
        .is("deleted_at", null)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (contactId) q = q.eq("contact_id", contactId);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useLead(id: string | undefined) {
  return useQuery({
    queryKey: leadKey(id ?? "none"),
    enabled: !!id,
    queryFn: async (): Promise<Lead | null> => {
      const { data, error } = await supabase.from("leads").select("*").eq("id", id!).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useSaveLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: LeadInput): Promise<Lead> => {
      const user_id = await getUserId();
      const payload = {
        user_id,
        contact_id: input.contact_id ?? null,
        title: input.title.trim(),
        stage: (input.stage ?? "new") as LeadStage,
        value: input.value ?? 0,
        probability: input.probability ?? 20,
        expected_close_date: input.expected_close_date || null,
        source: input.source?.trim() || null,
        notes: input.notes?.trim() || null,
      };
      if (input.id) {
        const { data, error } = await supabase
          .from("leads")
          .update(payload)
          .eq("id", input.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase.from("leads").insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: leadsKey });
      if (vars.id) qc.invalidateQueries({ queryKey: leadKey(vars.id) });
      toast.success(vars.id ? "Lead updated" : "Lead created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("leads")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: leadsKey });
      toast.success("Lead deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateLeadStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: LeadStage }) => {
      const { error } = await supabase.from("leads").update({ stage }).eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, stage }) => {
      await qc.cancelQueries({ queryKey: leadsKey });
      const snapshots = qc.getQueriesData<Lead[]>({ queryKey: leadsKey });
      snapshots.forEach(([key, prev]) => {
        if (!prev) return;
        qc.setQueryData<Lead[]>(
          key,
          prev.map((l) => (l.id === id ? { ...l, stage } : l)),
        );
      });
      return { snapshots };
    },
    onError: (e: Error, _vars, ctx) => {
      ctx?.snapshots.forEach(([key, prev]) => qc.setQueryData(key, prev));
      toast.error(e.message);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: leadsKey });
    },
  });
}

export function useLeadStageHistory(leadId: string | undefined) {
  return useQuery({
    queryKey: ["crm", "lead-history", leadId],
    enabled: !!leadId,
    queryFn: async (): Promise<LeadStageHistory[]> => {
      const { data, error } = await supabase
        .from("lead_stage_history")
        .select("*")
        .eq("lead_id", leadId!)
        .order("changed_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

// ============ ACTIVITIES ============

type Scope = { contactId?: string; leadId?: string };

export function activitiesKey(scope: Scope) {
  return ["crm", "activities", scope.contactId ?? null, scope.leadId ?? null] as const;
}

export function useActivities(scope: Scope) {
  return useQuery({
    queryKey: activitiesKey(scope),
    enabled: !!(scope.contactId || scope.leadId),
    queryFn: async (): Promise<CrmActivity[]> => {
      let q = supabase.from("crm_activities").select("*").order("occurred_at", { ascending: false });
      if (scope.contactId) q = q.eq("contact_id", scope.contactId);
      if (scope.leadId) q = q.eq("lead_id", scope.leadId);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAddActivity(scope: Scope) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { type: CrmActivityType; subject: string; body?: string }) => {
      const user_id = await getUserId();
      const { error } = await supabase.from("crm_activities").insert({
        user_id,
        contact_id: scope.contactId ?? null,
        lead_id: scope.leadId ?? null,
        type: input.type,
        subject: input.subject.trim(),
        body: input.body?.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: activitiesKey(scope) });
      toast.success("Activity logged");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ============ TASKS ============

export function tasksKey(scope: Scope) {
  return ["crm", "tasks", scope.contactId ?? null, scope.leadId ?? null] as const;
}

export function useCrmTasks(scope: Scope) {
  return useQuery({
    queryKey: tasksKey(scope),
    enabled: !!(scope.contactId || scope.leadId),
    queryFn: async (): Promise<CrmTask[]> => {
      let q = supabase.from("crm_tasks").select("*").order("due_date", { ascending: true });
      if (scope.contactId) q = q.eq("contact_id", scope.contactId);
      if (scope.leadId) q = q.eq("lead_id", scope.leadId);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAddCrmTask(scope: Scope) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { title: string; due_date?: string | null }) => {
      const user_id = await getUserId();
      const { error } = await supabase.from("crm_tasks").insert({
        user_id,
        contact_id: scope.contactId ?? null,
        lead_id: scope.leadId ?? null,
        title: input.title.trim(),
        due_date: input.due_date || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tasksKey(scope) });
      toast.success("Task added");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useToggleCrmTask(scope: Scope) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (task: CrmTask) => {
      const nextStatus: CrmTaskStatus = task.status === "done" ? "pending" : "done";
      const { error } = await supabase
        .from("crm_tasks")
        .update({
          status: nextStatus,
          completed_at: nextStatus === "done" ? new Date().toISOString() : null,
        })
        .eq("id", task.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: tasksKey(scope) }),
    onError: (e: Error) => toast.error(e.message),
  });
}

// ============ NOTES ============

export function notesKey(scope: Scope) {
  return ["crm", "notes", scope.contactId ?? null, scope.leadId ?? null] as const;
}

export function useCrmNotes(scope: Scope) {
  return useQuery({
    queryKey: notesKey(scope),
    enabled: !!(scope.contactId || scope.leadId),
    queryFn: async (): Promise<CrmNote[]> => {
      let q = supabase.from("crm_notes").select("*").order("created_at", { ascending: false });
      if (scope.contactId) q = q.eq("contact_id", scope.contactId);
      if (scope.leadId) q = q.eq("lead_id", scope.leadId);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAddCrmNote(scope: Scope) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: string) => {
      const user_id = await getUserId();
      const { error } = await supabase.from("crm_notes").insert({
        user_id,
        contact_id: scope.contactId ?? null,
        lead_id: scope.leadId ?? null,
        body: body.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notesKey(scope) });
      toast.success("Note added");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ============ ATTACHMENTS ============

export function attachmentsKey(scope: Scope) {
  return ["crm", "attachments", scope.contactId ?? null, scope.leadId ?? null] as const;
}

export function useCrmAttachments(scope: Scope) {
  return useQuery({
    queryKey: attachmentsKey(scope),
    enabled: !!(scope.contactId || scope.leadId),
    queryFn: async (): Promise<CrmAttachment[]> => {
      let q = supabase.from("crm_attachments").select("*").order("created_at", { ascending: false });
      if (scope.contactId) q = q.eq("contact_id", scope.contactId);
      if (scope.leadId) q = q.eq("lead_id", scope.leadId);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAddCrmAttachment(scope: Scope) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; url: string }) => {
      const user_id = await getUserId();
      const { error } = await supabase.from("crm_attachments").insert({
        user_id,
        contact_id: scope.contactId ?? null,
        lead_id: scope.leadId ?? null,
        name: input.name.trim(),
        url: input.url.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: attachmentsKey(scope) });
      toast.success("Attachment added");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
