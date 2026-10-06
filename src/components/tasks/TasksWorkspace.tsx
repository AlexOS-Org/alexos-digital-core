import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Circle,
  ListTodo,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ALEXOS_LOCALE } from "@/lib/locale";
import { useDeleteTask, useSaveTask, useTasks, useToggleTask, type Task } from "@/lib/tasks/api";
import { filterTasks, isTaskComplete, taskStats, type TaskFilter } from "@/lib/tasks/model";

const priorityOptions = ["low", "medium", "high"] as const;

function formatDate(value: string | null) {
  if (!value) return "No due date";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? "No due date"
    : new Intl.DateTimeFormat(ALEXOS_LOCALE, {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(date);
}

function isOverdue(task: Task) {
  return Boolean(
    task.due_date && task.due_date < new Date().toISOString().slice(0, 10) && !isTaskComplete(task),
  );
}

export function TasksWorkspace() {
  const { data: tasks = [], isLoading, isError, error, refetch } = useTasks();
  const save = useSaveTask();
  const toggle = useToggleTask();
  const remove = useDeleteTask();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [editing, setEditing] = useState<Task | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("medium");

  const visible = useMemo(() => filterTasks(tasks, search, filter), [tasks, search, filter]);
  const stats = useMemo(() => taskStats(tasks), [tasks]);
  const formTitle = editing ? "Edit task" : "Create task";

  const resetForm = () => {
    setEditing(null);
    setTitle("");
    setDescription("");
    setDueDate("");
    setPriority("medium");
  };

  const startEditing = (task: Task) => {
    setEditing(task);
    setTitle(task.title);
    setDescription(task.description ?? "");
    setDueDate(task.due_date ?? "");
    setPriority(task.priority ?? "medium");
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim() || save.isPending) return;
    save.mutate(
      {
        id: editing?.id,
        title,
        description,
        due_date: dueDate || null,
        priority,
      },
      { onSuccess: resetForm },
    );
  };

  const deleteTask = (task: Task) => {
    if (remove.isPending || !window.confirm(`Delete “${task.title}”?`)) return;
    remove.mutate(task.id);
    if (editing?.id === task.id) resetForm();
  };

  return (
    <div className="alexos-module-shell space-y-6 rounded-[2rem] p-1 sm:p-2">
      <div className="dashboard-feature-surface relative overflow-hidden rounded-xl p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-primary/15 bg-background/80 text-primary shadow-sm">
              <ListTodo className="h-6 w-6" />
            </div>
            <div>
              <p className="dashboard-eyebrow mb-1">AlexOS execution workspace</p>
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Tasks</h1>
                <Badge variant="outline">Connected</Badge>
              </div>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                Capture priorities, keep ownership clear, and move the work that matters today.
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/70 px-3 py-2 text-xs text-muted-foreground">
            Synced to your AlexOS workspace
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {["Today", "Open", "Completed", "Total"].map((label, index) => (
          <Card key={label} className="alexos-data-metric alexos-module-card rounded-xl">
            <CardContent className="relative z-[1] p-4">
              <p className="dashboard-eyebrow text-[10px]">{label}</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight">{stats[index]}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="dashboard-surface alexos-module-card rounded-xl">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">Your tasks</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                Only tasks owned by your authenticated account are returned.
              </p>
            </div>
            <div className="relative w-full sm:w-52">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search tasks"
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Task filters">
              {(["all", "open", "completed"] as const).map((value) => (
                <Button
                  key={value}
                  type="button"
                  size="sm"
                  variant={filter === value ? "default" : "outline"}
                  onClick={() => setFilter(value)}
                >
                  {value[0].toUpperCase() + value.slice(1)}
                </Button>
              ))}
            </div>

            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full rounded-2xl" />
                <Skeleton className="h-16 w-full rounded-2xl" />
                <Skeleton className="h-16 w-full rounded-2xl" />
              </div>
            ) : isError ? (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center">
                <p className="font-medium">Tasks could not be loaded.</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {error instanceof Error ? error.message : "Try again."}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-4"
                  onClick={() => void refetch()}
                >
                  Retry
                </Button>
              </div>
            ) : visible.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/60 p-10 text-center">
                <ListTodo className="mx-auto h-9 w-9 text-muted-foreground/60" />
                <p className="mt-3 font-medium">
                  {tasks.length ? "No matching tasks" : "No tasks yet"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {tasks.length
                    ? "Try another search or filter."
                    : "Create your first task to start a durable work list."}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {visible.map((task) => {
                  const completed = isTaskComplete(task);
                  return (
                    <div
                      key={task.id}
                      className="flex items-start gap-3 rounded-2xl border border-border/60 p-3 transition-colors hover:bg-muted/40"
                    >
                      <button
                        type="button"
                        onClick={() => toggle.mutate(task)}
                        disabled={toggle.isPending}
                        className="mt-0.5 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        aria-label={completed ? `Reopen ${task.title}` : `Complete ${task.title}`}
                      >
                        {completed ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground" />
                        )}
                      </button>
                      <div className="min-w-0 flex-1">
                        <p
                          className={`font-medium ${completed ? "line-through text-muted-foreground" : ""}`}
                        >
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                            {task.description}
                          </p>
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span className={isOverdue(task) ? "font-medium text-destructive" : ""}>
                            <CalendarDays className="mr-1 inline h-3.5 w-3.5" />
                            {isOverdue(task) ? "Overdue · " : ""}
                            {formatDate(task.due_date)}
                          </span>
                          {task.priority && (
                            <Badge variant={task.priority === "high" ? "destructive" : "secondary"}>
                              {task.priority}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => startEditing(task)}
                          aria-label={`Edit ${task.title}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteTask(task)}
                          aria-label={`Delete ${task.title}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="dashboard-surface alexos-module-card rounded-xl">
          <CardHeader>
            <CardTitle className="text-base">{formTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="task-title">Title</Label>
                <Input
                  id="task-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="What needs to move forward?"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-description">Description</Label>
                <Textarea
                  id="task-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Optional detail"
                  rows={4}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="task-due-date">Due date</Label>
                  <Input
                    id="task-due-date"
                    type="date"
                    value={dueDate}
                    onChange={(event) => setDueDate(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="task-priority">Priority</Label>
                  <select
                    id="task-priority"
                    value={priority}
                    onChange={(event) => setPriority(event.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {priorityOptions.map((value) => (
                      <option key={value} value={value}>
                        {value[0].toUpperCase() + value.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1" disabled={save.isPending || !title.trim()}>
                  {save.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  {editing ? "Save changes" : "Create task"}
                </Button>
                {editing && (
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                )}
              </div>
            </form>
            <p className="mt-4 text-xs leading-5 text-muted-foreground">
              Tasks use the existing owner-scoped table and RLS policy. No schema change or
              business-wide sharing is introduced.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
