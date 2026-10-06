import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Task = Database["public"]["Tables"]["tasks"]["Row"];

export type TaskInput = {
  title: string;
  description?: string | null;
  due_date?: string | null;
  priority?: string | null;
};

export const tasksKey = ["tasks"] as const;

async function getUserId(): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Not authenticated");
  return user.id;
}

export function useTasks() {
  return useQuery({
    queryKey: tasksKey,
    queryFn: async (): Promise<Task[]> => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("due_date", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSaveTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: TaskInput & { id?: string }): Promise<Task> => {
      const user_id = await getUserId();
      const title = input.title.trim();
      if (!title) throw new Error("Task title is required");

      const payload = {
        user_id,
        title,
        description: input.description?.trim() || null,
        due_date: input.due_date || null,
        priority: input.priority?.trim() || null,
      };

      if (input.id) {
        const { data, error } = await supabase
          .from("tasks")
          .update(payload)
          .eq("id", input.id)
          .eq("user_id", user_id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }

      const { data, error } = await supabase.from("tasks").insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_task, input) => {
      void queryClient.invalidateQueries({ queryKey: tasksKey });
      toast.success(input.id ? "Task updated" : "Task created");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useToggleTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (task: Task): Promise<void> => {
      const user_id = await getUserId();
      const completed = task.status !== "done" && task.status !== "completed";
      const { error } = await supabase
        .from("tasks")
        .update({
          status: completed ? "done" : "pending",
          completed_at: completed ? new Date().toISOString() : null,
        })
        .eq("id", task.id)
        .eq("user_id", user_id);
      if (error) throw error;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: tasksKey }),
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const user_id = await getUserId();
      const { error } = await supabase.from("tasks").delete().eq("id", id).eq("user_id", user_id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tasksKey });
      toast.success("Task deleted");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
