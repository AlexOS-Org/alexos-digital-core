import type { Task } from "./api";

export type TaskFilter = "all" | "open" | "completed";

export function isTaskComplete(task: Pick<Task, "status" | "completed_at">): boolean {
  return task.status === "done" || task.status === "completed" || Boolean(task.completed_at);
}

export function filterTasks(tasks: Task[], search: string, filter: TaskFilter): Task[] {
  const query = search.trim().toLowerCase();
  return tasks.filter((task) => {
    const matchesSearch = !query
      ? true
      : [task.title, task.description, task.priority].some((value) =>
          value?.toLowerCase().includes(query),
        );
    const matchesFilter =
      filter === "all" || (filter === "completed" ? isTaskComplete(task) : !isTaskComplete(task));
    return matchesSearch && matchesFilter;
  });
}

export function taskStats(tasks: Task[], today = new Date()): [number, number, number, number] {
  const todayKey = today.toISOString().slice(0, 10);
  const todayCount = tasks.filter(
    (task) => task.due_date === todayKey && !isTaskComplete(task),
  ).length;
  const openCount = tasks.filter((task) => !isTaskComplete(task)).length;
  const completedCount = tasks.length - openCount;
  return [todayCount, openCount, completedCount, tasks.length];
}
