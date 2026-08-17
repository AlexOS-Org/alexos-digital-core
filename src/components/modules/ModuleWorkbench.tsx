import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  BarChart3,
  CalendarDays,
  Car,
  CheckCircle2,
  Megaphone,
  Plus,
  Search,
  ShoppingBag,
  Trash2,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type WorkItem = {
  id: string;
  title: string;
  detail: string;
  status: string;
  createdAt: string;
};

type Mode = "tasks" | "calendar" | "ecommerce" | "marketing" | "vehicle" | "banking" | "reports";

type Config = {
  title: string;
  subtitle: string;
  icon: typeof BarChart3;
  labels: [string, string, string, string];
  placeholder: string;
};

const CONFIG: Record<Mode, Config> = {
  tasks: {
    title: "Tasks",
    subtitle: "Turn priorities into visible progress and keep today's execution moving.",
    icon: CheckCircle2,
    labels: ["Today", "Open", "Completed", "Total"],
    placeholder: "What needs to move forward?",
  },
  calendar: {
    title: "Calendar",
    subtitle: "Keep commitments, meetings and important moments in one clear place.",
    icon: CalendarDays,
    labels: ["Today", "Open", "Completed", "Total"],
    placeholder: "Add a meeting or event",
  },
  ecommerce: {
    title: "E-Commerce",
    subtitle: "A focused commerce workspace for products, orders and sales activity.",
    icon: ShoppingBag,
    labels: ["Products", "Open", "Completed", "Total"],
    placeholder: "Add a product or order",
  },
  marketing: {
    title: "Marketing",
    subtitle: "Plan campaigns, capture the message and measure what is actually producing results.",
    icon: Megaphone,
    labels: ["Campaigns", "Open", "Completed", "Total"],
    placeholder: "Add a campaign",
  },
  vehicle: {
    title: "Vehicle Sales",
    subtitle: "Track vehicle opportunities from stock to customer, financing and sale.",
    icon: Car,
    labels: ["Opportunities", "Open", "Completed", "Total"],
    placeholder: "Add a vehicle opportunity",
  },
  banking: {
    title: "Banking",
    subtitle:
      "A relationship and opportunity workspace for banking, loans, deposits and partnerships.",
    icon: Wallet,
    labels: ["Opportunities", "Open", "Completed", "Total"],
    placeholder: "Add a banking opportunity",
  },
  reports: {
    title: "Reports",
    subtitle:
      "Turn AlexOS activity into decisions: what moved, what is stuck and what deserves attention.",
    icon: BarChart3,
    labels: ["Reports", "Open", "Completed", "Total"],
    placeholder: "Add a report note",
  },
};

const KEY = (mode: Mode) => `alexos-workbench-${mode}-v1`;

function read(mode: Mode): WorkItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(KEY(mode)) || "[]") as WorkItem[];
  } catch {
    return [];
  }
}

export function ModuleWorkbench({ mode }: { mode: Mode }) {
  const config = CONFIG[mode];
  const Icon = config.icon;
  const [items, setItems] = useState<WorkItem[]>(() => read(mode));
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    window.localStorage.setItem(KEY(mode), JSON.stringify(items));
  }, [mode, items]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? items.filter((x) => `${x.title} ${x.detail}`.toLowerCase().includes(q)) : items;
  }, [items, search]);

  const add = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setItems((current) => [
      {
        id: crypto.randomUUID(),
        title: title.trim(),
        detail: detail.trim(),
        status: "Open",
        createdAt: new Date().toISOString(),
      },
      ...current,
    ]);
    setTitle("");
    setDetail("");
  };

  const remove = (id: string) => setItems((current) => current.filter((x) => x.id !== id));

  const complete = (id: string) =>
    setItems((current) =>
      current.map((x) =>
        x.id === id ? { ...x, status: x.status === "Done" ? "Open" : "Done" } : x,
      ),
    );

  const openCount = items.filter((x) => x.status === "Open").length;
  const doneCount = items.filter((x) => x.status === "Done").length;
  const stats = [items.length, openCount, doneCount, items.length];

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-[2rem] border border-border/60 bg-gradient-to-br from-background via-background to-muted/70 p-6 shadow-sm sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border bg-background shadow-sm">
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  {config.title}
                </h1>
                <Badge variant="outline">V1 workspace</Badge>
              </div>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{config.subtitle}</p>
            </div>
          </div>
          <div className="rounded-xl border bg-background/70 px-3 py-2 text-xs text-muted-foreground">
            Ready for Phase 3 validation
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {config.labels.map((label, i) => (
          <Card key={label} className="border-border/60">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground">{label}</p>
              <p className="mt-2 text-2xl font-semibold">{stats[i]}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="border-border/60">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">Workspace activity</CardTitle>
            <div className="relative w-full sm:w-48">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search"
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent>
            {visible.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-10 text-center">
                <Icon className="mx-auto h-9 w-9 text-muted-foreground/60" />
                <p className="mt-3 font-medium">Nothing here yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add your first item on the right. This workspace is intentionally simple for the
                  Phase 3 validation cycle.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {visible.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-2xl border p-3 transition-colors hover:bg-muted/40"
                  >
                    <button
                      type="button"
                      onClick={() => complete(item.id)}
                      className="shrink-0"
                      aria-label="Toggle complete"
                    >
                      {item.status === "Done" ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2" />
                      )}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`font-medium ${item.status === "Done" ? "line-through text-muted-foreground" : ""}`}
                      >
                        {item.title}
                      </p>
                      {item.detail && (
                        <p className="truncate text-xs text-muted-foreground">{item.detail}</p>
                      )}
                    </div>
                    <span className="hidden text-xs text-muted-foreground sm:block">
                      {new Date(item.createdAt).toLocaleDateString("en-KE", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(item.id)}
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Quick add</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={add} className="space-y-3">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={config.placeholder}
              />
              <Input
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                placeholder="Optional detail"
              />
              <Button type="submit" className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add to AlexOS
              </Button>
            </form>
            <p className="mt-4 text-xs leading-5 text-muted-foreground">
              Entries are kept on this device during the validation cycle. Core financial data
              remains in Supabase; this V1 workspace does not alter Money Center data.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
