import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Pencil,
  Archive,
  CircleDollarSign,
  TrendingDown,
  AlertTriangle,
  Calendar,
} from "lucide-react";
import {
  useDebts,
  useArchiveDebt,
  debtRemaining,
  debtProgress,
  type Debt,
} from "@/lib/debts/api";
import { formatMoney, formatDate } from "@/lib/money/format";
import { DebtFormDialog } from "@/components/debts/DebtFormDialog";
import { DebtPaymentDialog } from "@/components/debts/DebtPaymentDialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/debt-management")({
  component: DebtsPage,
});

const priorityTone: Record<Debt["priority"], string> = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  low: "bg-muted text-muted-foreground",
};

function DebtsPage() {
  const { data: debts = [], isLoading } = useDebts();
  const archive = useArchiveDebt();

  const [formOpen, setFormOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [editing, setEditing] = useState<Debt | null>(null);
  const [paying, setPaying] = useState<Debt | null>(null);

  const active = debts.filter((d) => d.status === "active");

  const totalPrincipal = debts.reduce(
    (s, d) => s + Number(d.principal),
    0
  );

  const totalPaid = debts.reduce(
    (s, d) => s + Number(d.amount_paid),
    0
  );

  const totalRemaining = debts.reduce(
    (s, d) => s + debtRemaining(d),
    0
  );

  const monthlyObligation = active.reduce(
    (s, d) => s + Number(d.minimum_payment),
    0
  );

  const overallProgress =
    totalPrincipal > 0
      ? (totalPaid / totalPrincipal) * 100
      : 0;


  const today = new Date();

  const overdueDebts = active.filter(
    (d) =>
      d.due_date &&
      new Date(d.due_date) < today
  );


  const dueSoonDebts = active.filter((d) => {
    if (!d.due_date) return false;

    const due = new Date(d.due_date);

    const diff =
      (due.getTime() - today.getTime()) /
      (1000 * 60 * 60 * 24);

    return diff >= 0 && diff <= 7;
  });


  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };


  const openEdit = (d: Debt) => {
    setEditing(d);
    setFormOpen(true);
  };


  const openPay = (d: Debt) => {
    setPaying(d);
    setPayOpen(true);
  };


  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      <Card className="rounded-2xl border-0 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
        <CardContent className="p-6 sm:p-8 space-y-4">

          <div className="flex items-start justify-between gap-4 flex-wrap">

            <div>
              <div className="text-[11px] uppercase tracking-widest text-primary-foreground/70">
                Debt Management
              </div>

              <div className="mt-1 text-sm text-primary-foreground/70">
                Total Remaining
              </div>

              <div className="text-3xl sm:text-4xl font-semibold tracking-tight mt-1">
                {formatMoney(totalRemaining)}
              </div>
            </div>


            <Button
              onClick={openNew}
              variant="secondary"
              className="rounded-xl"
            >
              <Plus className="h-4 w-4 mr-1" />
              New Debt
            </Button>

          </div>


          <div className="space-y-1.5">

            <div className="flex justify-between text-xs text-primary-foreground/80">
              <span>
                Payoff Progress
              </span>

              <span>
                {overallProgress.toFixed(1)}%
              </span>
            </div>


            <Progress
              value={overallProgress}
              className="h-2 bg-primary-foreground/20"
            />

          </div>

        </CardContent>
      </Card>


      <section className="grid gap-3 grid-cols-2 lg:grid-cols-6">

        {[
          {
            label: "Total Debt",
            value: totalPrincipal,
            icon: TrendingDown,
            tone: "text-destructive",
            money: true,
          },
          {
            label: "Total Paid",
            value: totalPaid,
            icon: CircleDollarSign,
            tone: "text-[color:var(--success)]",
            money: true,
          },
          {
            label: "Remaining",
            value: totalRemaining,
            icon: AlertTriangle,
            tone: "text-amber-600",
            money: true,
          },
          {
            label: "Monthly Obligation",
            value: monthlyObligation,
            icon: Calendar,
            tone: "text-primary",
            money: true,
          },
          {
            label: "Overdue",
            value: overdueDebts.length,
            icon: AlertTriangle,
            tone: "text-destructive",
            money: false,
          },
          {
            label: "Due in 7 Days",
            value: dueSoonDebts.length,
            icon: Calendar,
            tone: "text-amber-600",
            money: false,
          },
        ].map((k) => (

          <Card key={k.label} className="rounded-2xl">

            <CardHeader className="pb-1 flex flex-row items-center justify-between space-y-0">

              <CardTitle className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                {k.label}
              </CardTitle>

              <k.icon className={cn("h-4 w-4", k.tone)} />

            </CardHeader>


            <CardContent>

              <div className="text-lg font-semibold tracking-tight truncate">
                {k.money
                  ? formatMoney(k.value)
                  : k.value}
              </div>

            </CardContent>

          </Card>

        ))}

      </section>
      <section className="space-y-3">

        <div className="flex items-baseline justify-between">

          <h2 className="text-lg font-semibold tracking-tight">
            Your Debts
          </h2>

          <span className="text-xs text-muted-foreground">
            {debts.length} total
          </span>

        </div>


        {isLoading && (

          <div className="grid gap-3 grid-cols-1 lg:grid-cols-2">

            {Array.from({ length: 4 }).map((_, i) => (

              <Skeleton
                key={i}
                className="h-40 rounded-2xl"
              />

            ))}

          </div>

        )}



        {!isLoading && debts.length === 0 && (

          <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">

            No debts yet. Click{" "}

            <span className="font-medium text-foreground">
              New Debt
            </span>

            {" "}to add up to 6 debts you're currently tracking.

          </div>

        )}



        <div className="grid gap-3 grid-cols-1 lg:grid-cols-2">

          {debts.map((d) => {

            const remaining = debtRemaining(d);
            const progress = debtProgress(d);

            const isOverdue =
              d.due_date &&
              new Date(d.due_date) < today &&
              d.status === "active";


            const isDueSoon =
              dueSoonDebts.some(
                (item) => item.id === d.id
              );


            return (

              <Card
                key={d.id}
                className={cn(
                  "rounded-2xl transition-shadow hover:shadow-md",
                  isOverdue && "border-destructive/50",
                  isDueSoon && "border-amber-500/50"
                )}
              >

                <CardContent className="p-5 space-y-4">


                  <div className="flex items-start justify-between gap-2">

                    <div className="min-w-0">

                      <div className="flex items-center gap-2 flex-wrap">

                        <div className="font-medium truncate">
                          {d.name}
                        </div>


                        <Badge
                          variant="outline"
                          className={cn(
                            "capitalize text-[10px]",
                            priorityTone[d.priority]
                          )}
                        >
                          {d.priority}
                        </Badge>


                        {isOverdue && (

                          <Badge
                            variant="destructive"
                            className="text-[10px]"
                          >
                            Overdue
                          </Badge>

                        )}


                        {isDueSoon && !isOverdue && (

                          <Badge
                            variant="outline"
                            className="text-[10px] border-amber-500 text-amber-600"
                          >
                            Due Soon
                          </Badge>

                        )}



                        {d.status !== "active" && (

                          <Badge
                            variant="secondary"
                            className="capitalize text-[10px]"
                          >
                            {d.status}
                          </Badge>

                        )}

                      </div>



                      <div className="text-xs text-muted-foreground mt-0.5">

                        {d.category ?? "—"} ·{" "}
                        {Number(d.interest_rate).toFixed(2)}% APR

                        {d.due_date && (
                          <>
                            {" "}· Due {formatDate(d.due_date)}
                          </>
                        )}

                      </div>


                    </div>



                    <div className="flex gap-1">


                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => openEdit(d)}
                        title="Edit"
                      >

                        <Pencil className="h-4 w-4" />

                      </Button>



                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => archive.mutate(d.id)}
                        title="Archive"
                      >

                        <Archive className="h-4 w-4" />

                      </Button>


                    </div>


                  </div>




                  <div className="grid grid-cols-3 gap-3 text-sm">


                    <div>

                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                        Principal
                      </div>

                      <div className="font-semibold">
                        {formatMoney(d.principal)}
                      </div>

                    </div>



                    <div>

                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                        Paid
                      </div>

                      <div className="font-semibold text-[color:var(--success)]">
                        {formatMoney(d.amount_paid)}
                      </div>

                    </div>



                    <div>

                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                        Remaining
                      </div>

                      <div className="font-semibold text-destructive">
                        {formatMoney(remaining)}
                      </div>

                    </div>


                  </div>





                  <div className="space-y-1.5">

                    <div className="flex justify-between text-xs text-muted-foreground">

                      <span>
                        Progress
                      </span>

                      <span>
                        {progress.toFixed(1)}%
                      </span>

                    </div>


                    <Progress
                      value={progress}
                      className="h-2"
                    />


                  </div>





                  <div className="flex items-center justify-between pt-1">


                    <div className="text-xs text-muted-foreground">

                      Min:{" "}

                      <span className="font-medium text-foreground">

                        {formatMoney(d.minimum_payment)}

                      </span>

                    </div>




                    <Button
                      size="sm"
                      onClick={() => openPay(d)}
                      disabled={d.status !== "active"}
                    >

                      <CircleDollarSign className="h-4 w-4 mr-1" />

                      Pay

                    </Button>


                  </div>


                </CardContent>


              </Card>


            );

          })}


        </div>


      </section>



      <DebtFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        debt={editing}
      />



      <DebtPaymentDialog
        open={payOpen}
        onOpenChange={setPayOpen}
        debt={paying}
      />


    </div>

  );

}

