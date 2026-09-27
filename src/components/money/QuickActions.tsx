import { useState } from "react";
import { ArrowDownCircle, ArrowUpCircle, Repeat, Clock, PiggyBank } from "lucide-react";
import { TransactionFormDialog } from "./TransactionFormDialog";
import { ExpectedFormDialog } from "./ExpectedFormDialog";
import { BudgetFormDialog } from "./BudgetFormDialog";
import { monthKey } from "@/lib/money/format";
import { cn } from "@/lib/utils";

interface Props {
  compact?: boolean;
}

export function QuickActions({ compact = false }: Props) {
  const [open, setOpen] = useState<
    null | "income" | "expense" | "transfer" | "expected" | "budget"
  >(null);

  const actions = [
    { key: "income", label: "Receive", icon: ArrowDownCircle, tone: "income" },
    { key: "expense", label: "Spend", icon: ArrowUpCircle, tone: "expense" },
    { key: "transfer", label: "Transfer", icon: Repeat, tone: "info" },
    { key: "expected", label: "Expected", icon: Clock, tone: "warning" },
    { key: "budget", label: "Budget", icon: PiggyBank, tone: "debt" },
  ] as const;

  return (
    <>
      <section aria-label="Quick actions" className="space-y-2">
        <h2 className="alexos-metric-label">Record money</h2>
        <div
          className={cn(
            "grid gap-2",
            compact ? "grid-cols-3 sm:grid-cols-5" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
          )}
        >
          {actions.map((a) => (
            <button
              key={a.key}
              type="button"
              data-tone={a.tone}
              onClick={() => setOpen(a.key)}
              className="alexos-focusable alexos-card alexos-card-interactive alexos-tone-bg flex h-auto flex-col items-start gap-2 p-4 text-left"
            >
              <span className="alexos-tone-bg alexos-tone-border alexos-tone-text grid size-9 place-items-center rounded-lg border">
                <a.icon aria-hidden="true" className="size-4" />
              </span>
              <span className="text-sm font-semibold">{a.label}</span>
            </button>
          ))}
        </div>
      </section>

      <TransactionFormDialog
        open={open === "income"}
        onOpenChange={(v) => !v && setOpen(null)}
        mode="income"
      />
      <TransactionFormDialog
        open={open === "expense"}
        onOpenChange={(v) => !v && setOpen(null)}
        mode="expense"
      />
      <TransactionFormDialog
        open={open === "transfer"}
        onOpenChange={(v) => !v && setOpen(null)}
        mode="transfer"
      />
      <ExpectedFormDialog open={open === "expected"} onOpenChange={(v) => !v && setOpen(null)} />
      <BudgetFormDialog
        open={open === "budget"}
        onOpenChange={(v) => !v && setOpen(null)}
        month={monthKey()}
      />
    </>
  );
}
