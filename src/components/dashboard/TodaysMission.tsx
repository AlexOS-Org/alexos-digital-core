import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Clock3 } from "lucide-react";
import { useBills } from "@/lib/money/bills";
import { useExpected } from "@/lib/money/api";
import { useDebts } from "@/lib/debts/api";

export default function TodaysMission() {
  const { data: bills = [] } = useBills();
  const { data: expected = [] } = useExpected("pending");
  const { data: debts = [] } = useDebts();

  const today = new Date().toISOString().slice(0, 10);

  const overdueBills = bills.filter(
    (bill) =>
      bill.status === "pending" &&
      bill.due_date &&
      bill.due_date < today
  ).length;

  const expectedToday = expected.filter(
    (item) => item.expected_date === today
  ).length;

  const activeDebts = debts.filter(
    (debt) => debt.status !== "paid"
  ).length;

  const tasks = [
    {
      title: "Review overdue bills",
      value: overdueBills,
    },
    {
      title: "Expected payments today",
      value: expectedToday,
    },
    {
      title: "Active debts to monitor",
      value: activeDebts,
    },
  ];

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle>Today's Mission</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {tasks.map((task) => (
          <div
            key={task.title}
            className="flex items-center justify-between rounded-xl border p-4"
          >
            <div className="flex items-center gap-3">
              {task.value > 0 ? (
                <Clock3 className="h-5 w-5 text-amber-600" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              )}

              <span>{task.title}</span>
            </div>

            <span className="font-bold text-lg">
              {task.value}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}