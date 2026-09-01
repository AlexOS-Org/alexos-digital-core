/**
 * DailyGear — domain types.
 *
 * These are the stable contracts the UI codes against. They are derived from
 * the generated database types so a schema change surfaces as a type error
 * instead of a runtime surprise, but every "intelligence" surface is defined
 * independently so external providers can be plugged in later without
 * touching persistence.
 */
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

/* ── Persisted entities ───────────────────────────────────────── */

export type Product = Tables<"dg_products">;
export type ProductInsert = TablesInsert<"dg_products">;
export type ProductUpdate = TablesUpdate<"dg_products">;

export type ProductEvidence = Tables<"dg_product_evidence">;
export type ProductEvidenceInsert = TablesInsert<"dg_product_evidence">;
export type ProductEvidenceUpdate = TablesUpdate<"dg_product_evidence">;

export type ProductVariant = Tables<"dg_product_variants">;
export type Category = Tables<"dg_categories">;
export type Brand = Tables<"dg_brands">;
export type Supplier = Tables<"dg_suppliers">;
export type Warehouse = Tables<"dg_warehouses">;

export type Customer = Tables<"dg_customers">;
export type CustomerInsert = TablesInsert<"dg_customers">;

export type Order = Tables<"dg_orders">;
export type OrderInsert = TablesInsert<"dg_orders">;
export type OrderItem = Tables<"dg_order_items">;
export type OrderEvent = Tables<"dg_order_events">;
export type StockMovement = Tables<"dg_stock_movements">;
export type Funnel = Tables<"dg_funnels">;
export type FunnelStep = Tables<"dg_funnel_steps">;
export type OrderAttribution = Tables<"dg_order_attribution">;

export type FunnelStatus = Funnel["status"];
export type FunnelStepType = FunnelStep["step_type"];
export type FunnelOfferRole = "primary" | "order_bump" | "upsell" | "downsell";

export interface FunnelAttribution {
  source?: string;
  medium?: string;
  campaign?: string;
  campaignId?: string;
  adSet?: string;
  adSetId?: string;
  ad?: string;
  adId?: string;
  creative?: string;
  creativeId?: string;
  landingPage?: string;
  destinationUrl?: string;
}

export type ProductStatus = Product["status"];
export type OrderStatus = Order["status"];
export type PaymentStatus = Order["payment_status"];
export type StockMovementType = StockMovement["type"];

export interface ProductReadiness {
  available: boolean;
  hasMinimumStock: boolean;
  hasConfirmedAvailability: boolean;
  hasCategory: boolean;
  hasEvidence: boolean;
  readyToPublish: boolean;
}

export function getProductReadiness(
  product: Pick<Product, "stock_quantity" | "availability_confirmed" | "status" | "category_id">,
  evidenceCount = 0,
): ProductReadiness {
  // Quantity is an owner-managed inventory signal, not a storefront sellability gate.
  // Products remain orderable until their explicit status is set to out_of_stock.
  const hasMinimumStock = true;
  const hasConfirmedAvailability = product.availability_confirmed === true;
  const hasCategory = Boolean(product.category_id);
  const hasEvidence = evidenceCount > 0;
  const available = product.status === "active";
  return {
    available,
    hasMinimumStock,
    hasConfirmedAvailability,
    hasCategory,
    hasEvidence,
    readyToPublish: hasConfirmedAvailability && hasCategory && hasEvidence,
  };
}

export interface OrderWithCustomer extends Order {
  customer: Pick<Customer, "id" | "first_name" | "last_name" | "email" | "phone"> | null;
}

/* ── Analytics ────────────────────────────────────────────────── */

export interface CommerceKpis {
  revenue: number;
  profit: number;
  orders: number;
  pendingOrders: number;
  deliveredOrders: number;
  averageOrderValue: number;
  inventoryValue: number;
  lowStockCount: number;
  customers: number;
  returningCustomers: number;
  conversionRate: number;
  revenueChangePct: number;
  ordersChangePct: number;
}

export interface TrendPoint {
  label: string;
  revenue: number;
  profit: number;
  orders: number;
}

/* ── Intelligence (provider-backed, no persistence yet) ───────── */

export type IntelligenceKind = "market" | "competitor" | "marketing" | "landing" | "advertising";

export type SignalTone = "positive" | "neutral" | "warning" | "critical";

export interface IntelligenceInsight {
  id: string;
  kind: IntelligenceKind;
  title: string;
  summary: string;
  metric?: string;
  changePct?: number;
  tone: SignalTone;
  recommendation?: string;
  source: string;
  /** Epistemic status: fact, inference or recommendation. */
  evidenceLevel?: "fact" | "inference" | "recommendation";
}

/**
 * Anything that can supply insights — a local heuristic today, a scraper,
 * a marketplace API or an AI model tomorrow. Register it in
 * `intelligence.ts`; every consumer picks it up automatically.
 */
export interface IntelligenceProvider {
  id: string;
  label: string;
  kinds: IntelligenceKind[];
  /** `false` until credentials / integration exist. */
  enabled: boolean;
  description: string;
  load(kind: IntelligenceKind, ctx: IntelligenceContext): Promise<IntelligenceInsight[]>;
}

export interface IntelligenceContext {
  products: Product[];
  orders: Order[];
  orderItems: OrderItem[];
  customers: Customer[];
  currency: string;
}
