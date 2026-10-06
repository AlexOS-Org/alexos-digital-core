import { describe, expect, it } from "vitest";
import type { Task } from "./api";
import { filterTasks, isTaskComplete, taskStats } from "./model";

const task = (overrides: Partial<Task> = {}): Task => ({
  id: "task-1",
  user_id: "user-1",
  title: "Send proposal",
  description: "Follow up with the school buyer",
  due_date: "2026-10-06",
  priority: "high",
  status: "pending",
  completed_at: null,
  created_at: "2026-10-05T10:00:00.000Z",
  contact_id: null,
  lead_id: null,
  ...overrides,
});

describe("Tasks workspace model", () => {
  it("recognizes both status and completion timestamp as completed", () => {
    expect(isTaskComplete(task({ status: "done" }))).toBe(true);
    expect(isTaskComplete(task({ status: "completed" }))).toBe(true);
    expect(isTaskComplete(task({ completed_at: "2026-10-06T08:00:00.000Z" }))).toBe(true);
    expect(isTaskComplete(task())).toBe(false);
  });

  it("filters by search text and completion state", () => {
    const tasks = [
      task(),
      task({ id: "task-2", title: "Review budget", status: "done", completed_at: "2026-10-06" }),
    ];

    expect(filterTasks(tasks, "school", "open")).toHaveLength(1);
    expect(filterTasks(tasks, "budget", "completed")).toHaveLength(1);
    expect(filterTasks(tasks, "", "all")).toHaveLength(2);
  });

  it("calculates today, open, completed, and total counts", () => {
    const tasks = [
      task(),
      task({ id: "task-2", due_date: "2026-10-07" }),
      task({ id: "task-3", status: "done", completed_at: "2026-10-06T08:00:00.000Z" }),
    ];

    expect(taskStats(tasks, new Date("2026-10-06T12:00:00.000Z"))).toEqual([1, 2, 1, 3]);
  });
});
