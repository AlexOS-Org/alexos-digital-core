import { env as workerEnv } from "cloudflare:workers";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { Order, Product } from "./types";

const AI_MODEL = "@cf/meta/llama-3.2-3b-instruct";
const MAX_ROWS = 5000;

export type AurenKpiPeriod = "last_7d" | "last_30d" | "this_month";

type ProductKpiRow = Pick<Product, "id" | "stock_quantity" | "low_stock_threshold" | "status">;
type OrderKpiRow = Pick<
  Order,
  "id" | "status" | "payment_status" | "total" | "currency" | "placed_at"
>;

export interface AurenKpiRequest {
  period?: AurenKpiPeriod;
}

export interface DailyGearKpiSnapshot {
  period: { from: string; until: string };
  currency: string | null;
  productCount: number;
  publishedProductCount: number;
  inventoryUnits: number;
  lowStockCount: number;
  customerCount: number;
  orderCount: number;
  paidOrderCount: number;
  pendingOrderCount: number;
  deliveredOrderCount: number;
  revenue: number;
  averageOrderValue: number | null;
  dataQuality: { warnings: string[] };
}

export interface AurenKpiResponse {
  status: "ready" | "no_data" | "ai_unavailable";
  snapshot: DailyGearKpiSnapshot;
  summary: string | null;
  model: string | null;
}

const SALE_STATUSES: Order["status"][] = ["new", "processing", "packed", "shipped", "delivered"];

function dateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function dateDaysAgo(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return dateOnly(date);
}

function dateRange(period: AurenKpiPeriod): { from: string; until: string } {
  const until = dateOnly(new Date());
  if (period === "this_month") {
    const monthStart = new Date();
    monthStart.setUTCDate(1);
    return { from: dateOnly(monthStart), until };
  }
  return { from: dateDaysAgo(period === "last_7d" ? 6 : 29), until };
}

function isInPeriod(value: string, range: { from: string; until: string }): boolean {
  const day = value.slice(0, 10);
  return day >= range.from && day <= range.until;
}

function isRecognizedOrder(order: OrderKpiRow): boolean {
  return (
    SALE_STATUSES.includes(order.status) &&
    order.status !== "cancelled" &&
    order.payment_status !== "refunded"
  );
}

function numberValue(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function extractAiText(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const payload = value as {
    response?: unknown;
    choices?: Array<{ message?: { content?: unknown } }>;
  };
  if (typeof payload.response === "string" && payload.response.trim()) {
    return payload.response.trim();
  }
  const content = payload.choices?.[0]?.message?.content;
  return typeof content === "string" && content.trim() ? content.trim() : null;
}

function aiPrompt(snapshot: DailyGearKpiSnapshot): string {
  return [
    "Review this DailyGear KPI snapshot and write a concise operational summary for the owner.",
    "Use only the supplied values. Never invent a number, trend, customer behavior, or cause.",
    "If a value is zero or unavailable, say so plainly. Keep the output to exactly three short labeled lines:",
    "Situation: what the snapshot says.",
    "Signal: the most important operational implication supported by the snapshot.",
    "Next move: one conservative action, or say that more real data is needed.",
    `Snapshot: ${JSON.stringify(snapshot)}`,
  ].join("\n");
}

export function validateAurenKpiRequest(raw: unknown): AurenKpiRequest {
  const input = (raw ?? {}) as Record<string, unknown>;
  const period = input.period;
  if (period === undefined) return { period: "last_30d" };
  if (period !== "last_7d" && period !== "last_30d" && period !== "this_month") {
    throw new Error("period must be last_7d, last_30d, or this_month.");
  }
  return { period };
}

export async function getDailyGearAurenKpiSummary(
  request: AurenKpiRequest,
  context: { supabase: SupabaseClient<Database>; userId: string },
): Promise<AurenKpiResponse> {
  const range = dateRange(request.period ?? "last_30d");
  const [productsResult, ordersResult, customersResult] = await Promise.all([
    context.supabase
      .from("dg_products")
      .select("id, stock_quantity, low_stock_threshold, status")
      .eq("user_id", context.userId)
      .is("deleted_at", null)
      .limit(MAX_ROWS),
    context.supabase
      .from("dg_orders")
      .select("id, status, payment_status, total, currency, placed_at")
      .eq("user_id", context.userId)
      .is("deleted_at", null)
      .limit(MAX_ROWS),
    context.supabase
      .from("dg_customers")
      .select("id", { count: "exact", head: true })
      .eq("user_id", context.userId)
      .is("deleted_at", null),
  ]);

  if (productsResult.error) throw productsResult.error;
  if (ordersResult.error) throw ordersResult.error;
  if (customersResult.error) throw customersResult.error;

  const products = (productsResult.data ?? []) as ProductKpiRow[];
  const orders = (ordersResult.data ?? []) as OrderKpiRow[];
  const recognizedOrders = orders.filter(
    (order) => isInPeriod(order.placed_at, range) && isRecognizedOrder(order),
  );
  const currencies = [...new Set(recognizedOrders.map((order) => order.currency).filter(Boolean))];
  const revenue = recognizedOrders.reduce((sum, order) => sum + numberValue(order.total), 0);
  const warnings: string[] = [];

  if (currencies.length > 1) {
    warnings.push(
      "More than one currency is present; totals should not be combined without FX conversion.",
    );
  }
  if (products.length === 0)
    warnings.push("No DailyGear products are available in the connected catalogue.");
  if (recognizedOrders.length === 0)
    warnings.push("No recognized DailyGear orders exist in this period.");

  const snapshot: DailyGearKpiSnapshot = {
    period: range,
    currency: currencies.length === 1 ? currencies[0] : currencies.length > 1 ? "mixed" : null,
    productCount: products.length,
    publishedProductCount: products.filter((product) => product.status === "published").length,
    inventoryUnits: products.reduce((sum, product) => sum + numberValue(product.stock_quantity), 0),
    lowStockCount: products.filter((product) => {
      const stock = numberValue(product.stock_quantity);
      const threshold = numberValue(product.low_stock_threshold);
      return threshold > 0 && stock <= threshold;
    }).length,
    customerCount: customersResult.count ?? 0,
    orderCount: recognizedOrders.length,
    paidOrderCount: recognizedOrders.filter((order) => order.payment_status === "paid").length,
    pendingOrderCount: recognizedOrders.filter((order) =>
      ["new", "processing", "packed", "shipped"].includes(order.status),
    ).length,
    deliveredOrderCount: recognizedOrders.filter((order) => order.status === "delivered").length,
    revenue,
    averageOrderValue: recognizedOrders.length ? revenue / recognizedOrders.length : null,
    dataQuality: { warnings },
  };

  const hasData =
    snapshot.productCount > 0 || snapshot.orderCount > 0 || snapshot.customerCount > 0;
  if (!hasData) {
    return { status: "no_data", snapshot, summary: null, model: null };
  }

  const ai = workerEnv.AI;
  if (!ai) {
    return { status: "ai_unavailable", snapshot, summary: null, model: null };
  }

  try {
    const result = await ai.run(AI_MODEL, {
      messages: [
        {
          role: "system",
          content: "You are Auren, the careful operational intelligence layer inside AlexOS.",
        },
        { role: "user", content: aiPrompt(snapshot) },
      ],
      max_tokens: 220,
      temperature: 0.2,
    });
    const summary = extractAiText(result);
    if (!summary) return { status: "ai_unavailable", snapshot, summary: null, model: AI_MODEL };
    return { status: "ready", snapshot, summary, model: AI_MODEL };
  } catch (error) {
    console.warn("Auren Workers AI summary unavailable:", error);
    return { status: "ai_unavailable", snapshot, summary: null, model: AI_MODEL };
  }
}
