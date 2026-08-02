import { DEAD_STOCK_DAYS } from "./constants";
import type {
  CommerceKpis,
  Customer,
  Order,
  OrderItem,
  Product,
  TrendPoint,
} from "./types";

/** Pure functions only — no data fetching, no React. Trivially testable. */

const num = (v: unknown) => (typeof v === "number" ? v : Number(v ?? 0)) || 0;

export function effectivePrice(p: Product) {
  return num(p.sale_price) > 0 ? num(p.sale_price) : num(p.price);
}

function inRange(iso: string, from: Date, to: Date) {
  const t = new Date(iso).getTime();
  return t >= from.getTime() && t < to.getTime();
}

function pctChange(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

const COUNTS_AS_SALE: Order["status"][] = [
  "new",
  "processing",
  "packed",
  "shipped",
  "delivered",
];

export function computeKpis(
  orders: Order[],
  items: OrderItem[],
  products: Product[],
  customers: Customer[],
  windowDays = 30,
): CommerceKpis {
  const now = new Date();
  const start = new Date(now.getTime() - windowDays * 86_400_000);
  const prevStart = new Date(start.getTime() - windowDays * 86_400_000);

  const sold = orders.filter((o) => COUNTS_AS_SALE.includes(o.status));
  const current = sold.filter((o) => inRange(o.placed_at, start, now));
  const previous = sold.filter((o) => inRange(o.placed_at, prevStart, start));

  const revenue = current.reduce((s, o) => s + num(o.total), 0);
  const prevRevenue = previous.reduce((s, o) => s + num(o.total), 0);

  const currentIds = new Set(current.map((o) => o.id));
  const cost = items
    .filter((i) => currentIds.has(i.order_id))
    .reduce((s, i) => s + num(i.unit_cost) * num(i.quantity), 0);

  const inventoryValue = products.reduce(
    (s, p) => s + num(p.cost_price) * num(p.stock_quantity),
    0,
  );

  const lowStockCount = products.filter(
    (p) => num(p.stock_quantity) <= num(p.low_stock_threshold),
  ).length;

  const ordersPerCustomer = new Map<string, number>();
  for (const o of sold) {
    if (!o.customer_id) continue;
    ordersPerCustomer.set(o.customer_id, (ordersPerCustomer.get(o.customer_id) ?? 0) + 1);
  }
  const returningCustomers = [...ordersPerCustomer.values()].filter((n) => n > 1).length;

  return {
    revenue,
    profit: revenue - cost,
    orders: current.length,
    pendingOrders: orders.filter((o) =>
      (["new", "processing", "packed"] as Order["status"][]).includes(o.status),
    ).length,
    deliveredOrders: orders.filter((o) => o.status === "delivered").length,
    averageOrderValue: current.length ? revenue / current.length : 0,
    inventoryValue,
    lowStockCount,
    customers: customers.length,
    returningCustomers,
    conversionRate: customers.length ? (ordersPerCustomer.size / customers.length) * 100 : 0,
    revenueChangePct: pctChange(revenue, prevRevenue),
    ordersChangePct: pctChange(current.length, previous.length),
  };
}

export function computeTrend(
  orders: Order[],
  items: OrderItem[],
  months = 6,
): TrendPoint[] {
  const buckets = new Map<string, TrendPoint>();
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.set(`${d.getFullYear()}-${d.getMonth()}`, {
      label: d.toLocaleDateString(undefined, { month: "short" }),
      revenue: 0,
      profit: 0,
      orders: 0,
    });
  }

  const costByOrder = new Map<string, number>();
  for (const i of items) {
    costByOrder.set(
      i.order_id,
      (costByOrder.get(i.order_id) ?? 0) + num(i.unit_cost) * num(i.quantity),
    );
  }

  for (const o of orders) {
    if (!COUNTS_AS_SALE.includes(o.status)) continue;
    const d = new Date(o.placed_at);
    const bucket = buckets.get(`${d.getFullYear()}-${d.getMonth()}`);
    if (!bucket) continue;
    bucket.revenue += num(o.total);
    bucket.profit += num(o.total) - (costByOrder.get(o.id) ?? 0);
    bucket.orders += 1;
  }

  return [...buckets.values()];
}

export interface ProductPerformance {
  product: Product;
  unitsSold: number;
  revenue: number;
  lastSoldAt: string | null;
}

export function computeProductPerformance(
  products: Product[],
  orders: Order[],
  items: OrderItem[],
): ProductPerformance[] {
  const orderDate = new Map(orders.map((o) => [o.id, o.placed_at]));

  return products
    .map((product) => {
      const rows = items.filter((i) => i.product_id === product.id);
      const lastSoldAt = rows
        .map((r) => orderDate.get(r.order_id) ?? null)
        .filter((d): d is string => Boolean(d))
        .sort()
        .at(-1) ?? null;

      return {
        product,
        unitsSold: rows.reduce((s, r) => s + num(r.quantity), 0),
        revenue: rows.reduce((s, r) => s + num(r.total), 0),
        lastSoldAt,
      };
    })
    .sort((a, b) => b.revenue - a.revenue);
}

export function isDeadStock(p: ProductPerformance) {
  if (Number(p.product.stock_quantity) <= 0) return false;
  if (!p.lastSoldAt) {
    return Date.now() - new Date(p.product.created_at).getTime() > DEAD_STOCK_DAYS * 86_400_000;
  }
  return Date.now() - new Date(p.lastSoldAt).getTime() > DEAD_STOCK_DAYS * 86_400_000;
}

export interface CustomerInsight {
  customer: Customer;
  orders: number;
  lifetimeValue: number;
  lastOrderAt: string | null;
}

export function computeCustomerInsights(
  customers: Customer[],
  orders: Order[],
): CustomerInsight[] {
  return customers
    .map((customer) => {
      const rows = orders.filter(
        (o) => o.customer_id === customer.id && COUNTS_AS_SALE.includes(o.status),
      );
      return {
        customer,
        orders: rows.length,
        lifetimeValue: rows.reduce((s, o) => s + num(o.total), 0),
        lastOrderAt: rows.map((o) => o.placed_at).sort().at(-1) ?? null,
      };
    })
    .sort((a, b) => b.lifetimeValue - a.lifetimeValue);
}

export function reorderSuggestions(products: Product[]) {
  return products
    .filter((p) => num(p.stock_quantity) <= num(p.low_stock_threshold))
    .map((p) => ({
      product: p,
      suggestedQuantity: Math.max(
        num(p.low_stock_threshold) * 2 - num(p.stock_quantity),
        1,
      ),
    }))
    .sort((a, b) => num(a.product.stock_quantity) - num(b.product.stock_quantity));
}
