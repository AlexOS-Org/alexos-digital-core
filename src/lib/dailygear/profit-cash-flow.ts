import type { NormalizedMetaInsight } from "@/lib/meta/normalization";
import type { Order, OrderItem } from "./types";

const SALE_STATUSES: Order["status"][] = ["new", "processing", "packed", "shipped", "delivered"];
const CASH_RECEIPT_STATUSES: Order["payment_status"][] = ["paid"];

export type CashFlowEventType =
  | "customer_receipt"
  | "customer_refund"
  | "payment_fee"
  | "delivery_payment"
  | "supplier_payment"
  | "other_operating_outflow";

export interface DailyGearCashFlowEvent {
  id: string;
  date: string;
  type: CashFlowEventType;
  amount: number;
  currency: string;
  orderId?: string | null;
  note?: string | null;
}

export interface DailyGearProfitCashFlowInput {
  orders: Order[];
  orderItems: OrderItem[];
  adInsights: NormalizedMetaInsight[];
  /** Explicit cash movements override inferred paid-order receipts. */
  cashEvents?: DailyGearCashFlowEvent[];
  from?: string;
  until?: string;
  /** Keep cancelled/refunded orders out of revenue and COGS. */
  includeOnlySaleStatuses?: boolean;
}

export interface DailyGearDailyFinancialSnapshot {
  date: string;
  revenue: number;
  cogs: number;
  grossProfit: number;
  adSpend: number;
  operatingExpenses: number;
  operatingProfit: number;
  cashReceived: number;
  cashOutflows: number;
  netCashFlow: number;
  orderCount: number;
  paidOrderCount: number;
  currency: string | null;
}

export interface DailyGearProfitCashFlowResult {
  currency: string | null;
  period: { from: string | null; until: string | null };
  orders: number;
  paidOrders: number;
  revenue: number;
  cogs: number;
  grossProfit: number;
  grossMarginPct: number | null;
  adSpend: number;
  paymentFees: number;
  deliveryCosts: number;
  supplierPayments: number;
  otherOperatingOutflows: number;
  operatingExpenses: number;
  operatingProfit: number;
  operatingMarginPct: number | null;
  cashReceived: number;
  cashOutflows: number;
  netCashFlow: number;
  cashConversionPct: number | null;
  revenuePerAdSpend: number | null;
  profitAfterAdSpend: number;
  daily: DailyGearDailyFinancialSnapshot[];
  dataQuality: {
    cashReceiptMethod: "explicit_events" | "paid_order_inference" | "none";
    adInsightRows: number;
    missingCogsItemCount: number;
    currencies: string[];
    warnings: string[];
  };
}

const num = (value: unknown): number => {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

function dateOnly(value: string): string {
  return value.slice(0, 10);
}

function inPeriod(date: string, from?: string, until?: string): boolean {
  const day = dateOnly(date);
  return (!from || day >= dateOnly(from)) && (!until || day <= dateOnly(until));
}

function percentage(numerator: number, denominator: number): number | null {
  return denominator > 0 ? (numerator / denominator) * 100 : null;
}

function isRecognizedSale(order: Order, includeOnlySaleStatuses: boolean): boolean {
  return (
    (!includeOnlySaleStatuses || SALE_STATUSES.includes(order.status)) &&
    order.payment_status !== "refunded" &&
    order.status !== "cancelled"
  );
}

function addToMap(map: Map<string, number>, key: string, amount: number): void {
  map.set(key, (map.get(key) ?? 0) + amount);
}

function currenciesFrom(
  orders: Order[],
  insights: NormalizedMetaInsight[],
  cashEvents: DailyGearCashFlowEvent[],
): string[] {
  return [
    ...new Set(
      [
        ...orders.map((order) => order.currency),
        ...insights.map((row) => row.currency),
        ...cashEvents.map((event) => event.currency),
      ].filter((currency): currency is string => Boolean(currency)),
    ),
  ];
}

/**
 * Calculates DailyGear profitability and cash flow without fetching or writing
 * data. The function intentionally keeps accounting and cash timing separate:
 * COGS affects profit when an order is recognized, while supplier payments,
 * payment fees, delivery payments, and customer receipts affect cash flow only
 * when supplied as explicit cash events.
 */
export function calculateDailyGearProfitAndCashFlow(
  input: DailyGearProfitCashFlowInput,
): DailyGearProfitCashFlowResult {
  const includeOnlySaleStatuses = input.includeOnlySaleStatuses ?? true;
  const orders = input.orders.filter((order) => inPeriod(order.placed_at, input.from, input.until));
  const orderById = new Map(orders.map((order) => [order.id, order]));
  const recognizedOrders = orders.filter((order) =>
    isRecognizedSale(order, includeOnlySaleStatuses),
  );
  const recognizedOrderIds = new Set(recognizedOrders.map((order) => order.id));
  const items = input.orderItems.filter((item) => recognizedOrderIds.has(item.order_id));
  const cogsByOrder = new Map<string, number>();
  let missingCogsItemCount = 0;

  for (const item of items) {
    const unitCost = num(item.unit_cost);
    if (unitCost <= 0) missingCogsItemCount += 1;
    addToMap(cogsByOrder, item.order_id, unitCost * num(item.quantity));
  }

  const adRows = input.adInsights.filter((row) => inPeriod(row.date, input.from, input.until));
  const adSpendByDate = new Map<string, number>();
  for (const row of adRows) addToMap(adSpendByDate, dateOnly(row.date), num(row.spend));

  const explicitEvents = (input.cashEvents ?? []).filter((event) =>
    inPeriod(event.date, input.from, input.until),
  );
  const hasExplicitReceipts = explicitEvents.some((event) => event.type === "customer_receipt");
  const cashReceivedByDate = new Map<string, number>();
  const cashOutflowsByDate = new Map<string, number>();
  const paymentFeesByDate = new Map<string, number>();
  const deliveryCostsByDate = new Map<string, number>();
  const supplierPaymentsByDate = new Map<string, number>();
  const otherOutflowsByDate = new Map<string, number>();

  if (hasExplicitReceipts) {
    for (const event of explicitEvents) {
      const day = dateOnly(event.date);
      if (event.type === "customer_receipt") addToMap(cashReceivedByDate, day, num(event.amount));
      if (event.type === "customer_refund") addToMap(cashOutflowsByDate, day, num(event.amount));
      if (event.type === "payment_fee") addToMap(paymentFeesByDate, day, num(event.amount));
      if (event.type === "delivery_payment") addToMap(deliveryCostsByDate, day, num(event.amount));
      if (event.type === "supplier_payment")
        addToMap(supplierPaymentsByDate, day, num(event.amount));
      if (event.type === "other_operating_outflow")
        addToMap(otherOutflowsByDate, day, num(event.amount));
    }
  } else {
    for (const order of recognizedOrders) {
      if (CASH_RECEIPT_STATUSES.includes(order.payment_status)) {
        addToMap(cashReceivedByDate, dateOnly(order.placed_at), num(order.total));
      }
    }
  }

  for (const row of adRows) {
    addToMap(cashOutflowsByDate, dateOnly(row.date), num(row.spend));
  }

  const revenue = recognizedOrders.reduce((sum, order) => sum + num(order.total), 0);
  const cogs = [...cogsByOrder.values()].reduce((sum, amount) => sum + amount, 0);
  const adSpend = adRows.reduce((sum, row) => sum + num(row.spend), 0);
  const paymentFees = [...paymentFeesByDate.values()].reduce((sum, amount) => sum + amount, 0);
  const deliveryCosts = [...deliveryCostsByDate.values()].reduce((sum, amount) => sum + amount, 0);
  const supplierPayments = [...supplierPaymentsByDate.values()].reduce(
    (sum, amount) => sum + amount,
    0,
  );
  const otherOperatingOutflows = [...otherOutflowsByDate.values()].reduce(
    (sum, amount) => sum + amount,
    0,
  );
  const operatingExpenses = adSpend + paymentFees + deliveryCosts + otherOperatingOutflows;
  const grossProfit = revenue - cogs;
  const operatingProfit = grossProfit - operatingExpenses;
  const cashReceived = [...cashReceivedByDate.values()].reduce((sum, amount) => sum + amount, 0);
  const cashOutflows =
    adSpend +
    paymentFees +
    deliveryCosts +
    supplierPayments +
    otherOperatingOutflows +
    [...explicitEvents]
      .filter((event) => event.type === "customer_refund")
      .reduce((sum, event) => sum + num(event.amount), 0);
  const netCashFlow = cashReceived - cashOutflows;
  const dates = new Set<string>([
    ...recognizedOrders.map((order) => dateOnly(order.placed_at)),
    ...adRows.map((row) => dateOnly(row.date)),
    ...explicitEvents.map((event) => dateOnly(event.date)),
  ]);

  const daily = [...dates].sort().map((date) => {
    const dayOrders = recognizedOrders.filter((order) => dateOnly(order.placed_at) === date);
    const dayRevenue = dayOrders.reduce((sum, order) => sum + num(order.total), 0);
    const dayCogs = dayOrders.reduce((sum, order) => sum + (cogsByOrder.get(order.id) ?? 0), 0);
    const dayAdSpend = adSpendByDate.get(date) ?? 0;
    const dayPaymentFees = paymentFeesByDate.get(date) ?? 0;
    const dayDeliveryCosts = deliveryCostsByDate.get(date) ?? 0;
    const dayOtherOutflows = otherOutflowsByDate.get(date) ?? 0;
    const dayOperatingExpenses = dayAdSpend + dayPaymentFees + dayDeliveryCosts + dayOtherOutflows;
    const dayCashReceived = cashReceivedByDate.get(date) ?? 0;
    const dayCashOutflows =
      dayAdSpend +
      dayPaymentFees +
      dayDeliveryCosts +
      (supplierPaymentsByDate.get(date) ?? 0) +
      dayOtherOutflows +
      explicitEvents
        .filter((event) => dateOnly(event.date) === date && event.type === "customer_refund")
        .reduce((sum, event) => sum + num(event.amount), 0);

    return {
      date,
      revenue: dayRevenue,
      cogs: dayCogs,
      grossProfit: dayRevenue - dayCogs,
      adSpend: dayAdSpend,
      operatingExpenses: dayOperatingExpenses,
      operatingProfit: dayRevenue - dayCogs - dayOperatingExpenses,
      cashReceived: dayCashReceived,
      cashOutflows: dayCashOutflows,
      netCashFlow: dayCashReceived - dayCashOutflows,
      orderCount: dayOrders.length,
      paidOrderCount: dayOrders.filter((order) =>
        CASH_RECEIPT_STATUSES.includes(order.payment_status),
      ).length,
      currency:
        orderById.get(dayOrders[0]?.id ?? "")?.currency ??
        adRows.find((row) => dateOnly(row.date) === date)?.currency ??
        null,
    };
  });

  const currencies = currenciesFrom(orders, adRows, explicitEvents);
  const warnings: string[] = [];
  if (currencies.length > 1)
    warnings.push(
      "Multiple currencies are present; totals must not be combined without FX conversion.",
    );
  if (missingCogsItemCount > 0)
    warnings.push(
      `${missingCogsItemCount} recognized order item(s) have zero or missing unit cost.`,
    );
  if (
    !hasExplicitReceipts &&
    recognizedOrders.some((order) => order.payment_status === "partial")
  ) {
    warnings.push(
      "Partial-payment orders were excluded from inferred cash receipts; provide explicit cash events for accurate cash flow.",
    );
  }
  if (adRows.some((row) => row.currency && currencies.length > 1)) {
    warnings.push(
      "Ad spend currency must match the order currency before calculating blended profitability.",
    );
  }

  return {
    currency: currencies.length === 1 ? currencies[0] : null,
    period: { from: input.from ?? null, until: input.until ?? null },
    orders: recognizedOrders.length,
    paidOrders: recognizedOrders.filter((order) =>
      CASH_RECEIPT_STATUSES.includes(order.payment_status),
    ).length,
    revenue,
    cogs,
    grossProfit,
    grossMarginPct: percentage(grossProfit, revenue),
    adSpend,
    paymentFees,
    deliveryCosts,
    supplierPayments,
    otherOperatingOutflows,
    operatingExpenses,
    operatingProfit,
    operatingMarginPct: percentage(operatingProfit, revenue),
    cashReceived,
    cashOutflows,
    netCashFlow,
    cashConversionPct: percentage(cashReceived, revenue),
    revenuePerAdSpend: adSpend > 0 ? revenue / adSpend : null,
    profitAfterAdSpend: revenue - cogs - adSpend,
    daily,
    dataQuality: {
      cashReceiptMethod: hasExplicitReceipts
        ? "explicit_events"
        : recognizedOrders.some((order) => CASH_RECEIPT_STATUSES.includes(order.payment_status))
          ? "paid_order_inference"
          : "none",
      adInsightRows: adRows.length,
      missingCogsItemCount,
      currencies,
      warnings,
    },
  };
}
