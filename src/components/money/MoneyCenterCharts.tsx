import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlexOSEmptyState } from "@/components/alexos/states";

/** Semantic series colours: the same meaning keeps the same colour across
 *  every chart, and the categorical ramp is only used for slices. */
const SERIES = {
  income: "hsl(150 55% 42%)",
  expense: "hsl(2 66% 52%)",
  neutral: "hsl(220 55% 48%)",
  expected: "hsl(35 85% 50%)",
} as const;

const CATEGORICAL = [
  "hsl(220 55% 48%)",
  "hsl(150 55% 42%)",
  "hsl(35 85% 50%)",
  "hsl(262 48% 54%)",
  "hsl(2 66% 52%)",
  "hsl(199 62% 46%)",
  "hsl(322 52% 52%)",
  "hsl(96 38% 40%)",
  "hsl(20 72% 50%)",
  "hsl(240 40% 55%)",
];

type ChartRow = { month: string; income: number; expense: number; cashflow: number };
type CategoryRow = { name: string; value: number };
type AccountRow = { name: string; balance: number };
type BudgetRow = { name: string; budget: number; actual: number };
type TrendRow = { date: string; value: number };

interface Props {
  monthly: ChartRow[];
  byCategory: CategoryRow[];
  bySource: CategoryRow[];
  budgetActual: BudgetRow[];
  accountBalanceData: AccountRow[];
  netWorthTrend: TrendRow[];
  expectedVsReceived: CategoryRow[];
  expectedCount: number;
  money: (value: number) => string;
}

export function MoneyCenterCharts({
  monthly,
  byCategory,
  bySource,
  budgetActual,
  accountBalanceData,
  netWorthTrend,
  expectedVsReceived,
  expectedCount,
  money,
}: Props) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ChartCard title="Income vs Expenses (last 12 months)">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={monthly}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="month" fontSize={11} />
            <YAxis fontSize={11} />
            <Tooltip formatter={(v: number) => money(v)} />
            <Legend />
            <Bar dataKey="income" fill={SERIES.income} radius={[6, 6, 0, 0]} />
            <Bar dataKey="expense" fill={SERIES.expense} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Cash Flow Trend">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={monthly}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="month" fontSize={11} />
            <YAxis fontSize={11} />
            <Tooltip formatter={(v: number) => money(v)} />
            <Line
              type="monotone"
              dataKey="cashflow"
              stroke={SERIES.neutral}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Expense Categories">
        {byCategory.length === 0 ? (
          <Empty />
        ) : (
          <PiePanel data={byCategory} offset={0} money={money} />
        )}
      </ChartCard>

      <ChartCard title="Income Sources">
        {bySource.length === 0 ? <Empty /> : <PiePanel data={bySource} offset={1} money={money} />}
      </ChartCard>

      <ChartCard title="Budget vs Actual (this month)">
        {budgetActual.length === 0 ? (
          <Empty label="No budgets for this month" />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={budgetActual}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="name" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip formatter={(v: number) => money(v)} />
              <Legend />
              <Bar dataKey="budget" fill={SERIES.neutral} radius={[6, 6, 0, 0]} />
              <Bar dataKey="actual" fill={SERIES.expense} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard title="Account Balances">
        {accountBalanceData.length === 0 ? (
          <Empty />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={accountBalanceData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis type="number" fontSize={11} />
              <YAxis type="category" dataKey="name" fontSize={11} width={80} />
              <Tooltip formatter={(v: number) => money(v)} />
              <Bar dataKey="balance" fill={SERIES.neutral} radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard title="Net Worth Trend">
        {netWorthTrend.length === 0 ? (
          <Empty />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={netWorthTrend}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="date" fontSize={10} />
              <YAxis fontSize={11} />
              <Tooltip formatter={(v: number) => money(v)} />
              <Line
                type="monotone"
                dataKey="value"
                stroke={SERIES.income}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard title="Expected vs Received">
        {expectedCount === 0 ? (
          <Empty />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={expectedVsReceived}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="name" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip formatter={(v: number) => money(v)} />
              <Bar dataKey="value" fill={SERIES.expected} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </div>
  );
}

function PiePanel({
  data,
  offset,
  money,
}: {
  data: CategoryRow[];
  offset: number;
  money: Props["money"];
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" outerRadius={95}>
          {data.map((_, index) => (
            <Cell key={index} fill={CATEGORICAL[(index + offset) % CATEGORICAL.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(v: number) => money(v)} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  const headingId = `chart-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <Card aria-labelledby={headingId}>
      <CardHeader>
        <CardTitle id={headingId} className="text-base">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function Empty({ label = "No data yet" }: { label?: string }) {
  return (
    <div className="h-[260px]">
      <AlexOSEmptyState title={label} description="Data will appear here once recorded." compact />
    </div>
  );
}
