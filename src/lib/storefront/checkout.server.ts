import type { Database, Json } from "@/integrations/supabase/types";
import type { FunnelAttribution, FunnelOfferRole } from "@/lib/dailygear/types";
import { markCartSessionConvertedImpl } from "./cart-session.server";

/**
 * Guest checkout — server-only implementation.
 *
 * Prices, stock and totals are recomputed from the database here; nothing
 * the browser sends about money is trusted. Runs with the service role
 * because a guest has no session, so every input is validated first.
 */
export interface GuestOrderLineInput {
  productId: string;
  variantId?: string | null;
  quantity: number;
  offerRole?: FunnelOfferRole;
  funnelStepId?: string | null;
}

export interface GuestOrderInput {
  storeSlug: string;
  firstName: string;
  lastName?: string | null;
  email?: string | null;
  phone: string;
  address: string;
  city?: string | null;
  notes?: string | null;
  paymentMethod: string;
  items: GuestOrderLineInput[];
  recoveryToken?: string | null;
  funnelId?: string | null;
  attribution?: FunnelAttribution | null;
}

const PAYMENT_METHODS = new Set(["cod", "mpesa", "card", "bank_transfer"]);
const OFFER_ROLES = new Set<FunnelOfferRole>(["primary", "order_bump", "upsell", "downsell"]);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function text(value: unknown, max = 200) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function validateGuestOrder(raw: unknown): GuestOrderInput {
  const input = (raw ?? {}) as Record<string, unknown>;
  const firstName = text(input["firstName"], 80);
  const phone = text(input["phone"], 40);
  const address = text(input["address"], 400);
  const storeSlug = text(input["storeSlug"], 80);
  const paymentMethod = text(input["paymentMethod"], 40) || "cod";
  const items = Array.isArray(input["items"]) ? input["items"] : [];

  if (!firstName) throw new Error("First name is required.");
  if (phone.length < 7) throw new Error("A valid phone number is required.");
  if (!address) throw new Error("A delivery address is required.");
  if (!storeSlug) throw new Error("Store could not be identified.");
  if (!PAYMENT_METHODS.has(paymentMethod)) throw new Error("Unsupported payment method.");
  if (items.length === 0) throw new Error("Your cart is empty.");
  if (items.length > 50) throw new Error("Too many items in one order.");

  const parsed: GuestOrderLineInput[] = items.map((entry) => {
    const line = (entry ?? {}) as Record<string, unknown>;
    const productId = text(line["productId"], 60);
    const quantity = Number(line["quantity"]);
    if (!productId) throw new Error("An item in your cart is invalid.");
    if (!Number.isFinite(quantity) || quantity < 1 || quantity > 999) {
      throw new Error("Item quantity is out of range.");
    }
    const variantId = text(line["variantId"], 60);
    const rawOfferRole = text(line["offerRole"], 20);
    const offerRole = OFFER_ROLES.has(rawOfferRole as FunnelOfferRole)
      ? (rawOfferRole as FunnelOfferRole)
      : "primary";
    const rawFunnelStepId = text(line["funnelStepId"], 80);
    const funnelStepId = UUID_RE.test(rawFunnelStepId) ? rawFunnelStepId : null;
    return {
      productId,
      variantId: variantId || null,
      quantity: Math.floor(quantity),
      offerRole,
      funnelStepId: offerRole === "primary" ? null : funnelStepId,
    };
  });

  const email = text(input["email"], 160);
  const rawFunnelId = text(input["funnelId"], 80);
  const funnelId = UUID_RE.test(rawFunnelId) ? rawFunnelId : null;
  const attributionInput = (input["attribution"] ?? {}) as Record<string, unknown>;
  const attribution: FunnelAttribution = {
    source: text(attributionInput["source"], 160) || undefined,
    medium: text(attributionInput["medium"], 160) || undefined,
    campaign: text(attributionInput["campaign"], 160) || undefined,
    campaignId: text(attributionInput["campaignId"], 160) || undefined,
    adSet: text(attributionInput["adSet"], 160) || undefined,
    adSetId: text(attributionInput["adSetId"], 160) || undefined,
    ad: text(attributionInput["ad"], 160) || undefined,
    adId: text(attributionInput["adId"], 160) || undefined,
    creative: text(attributionInput["creative"], 160) || undefined,
    creativeId: text(attributionInput["creativeId"], 160) || undefined,
    landingPage: text(attributionInput["landingPage"], 1000) || undefined,
    destinationUrl: text(attributionInput["destinationUrl"], 1000) || undefined,
  };

  if (parsed.some((item) => item.offerRole !== "primary") && !funnelId) {
    throw new Error("Offer context is missing. Please reopen the campaign page.");
  }

  return {
    storeSlug,
    firstName,
    lastName: text(input["lastName"], 80) || null,
    email: email || null,
    phone,
    address,
    city: text(input["city"], 80) || null,
    notes: text(input["notes"], 800) || null,
    paymentMethod,
    items: parsed,
    recoveryToken: /^[a-f0-9]{64}$/i.test(text(input["recoveryToken"], 100))
      ? text(input["recoveryToken"], 100).toLowerCase()
      : null,
    funnelId,
    attribution: funnelId ? attribution : null,
  };
}

export async function placeGuestOrderImpl(input: GuestOrderInput) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  type GuestOrderRpcArgs = Database["public"]["Functions"]["dg_create_guest_order"]["Args"];
  const rpcArgs = {
    p_store_slug: input.storeSlug,
    p_first_name: input.firstName,
    p_last_name: input.lastName ?? null,
    p_email: input.email ?? null,
    p_phone: input.phone,
    p_address: input.address,
    p_city: input.city ?? null,
    p_notes: input.notes ?? null,
    p_payment_method: input.paymentMethod,
    p_items: input.items as unknown as Json,
    p_funnel_id: input.funnelId ?? null,
    p_attribution: (input.attribution ?? {}) as unknown as Json,
  } as unknown as GuestOrderRpcArgs;
  const { data, error } = await supabaseAdmin.rpc("dg_create_guest_order", rpcArgs);
  if (error) throw error;

  const result = data as {
    orderNumber?: unknown;
    total?: unknown;
    subtotal?: unknown;
    shippingFee?: unknown;
    currency?: unknown;
    funnelId?: unknown;
  } | null;

  if (!result || typeof result.orderNumber !== "string") {
    throw new Error("The order was not created. Please try again.");
  }

  if (input.recoveryToken) {
    await markCartSessionConvertedImpl(input.storeSlug, input.recoveryToken);
  }

  return {
    orderNumber: result.orderNumber,
    total: Number(result.total ?? 0),
    subtotal: Number(result.subtotal ?? 0),
    shippingFee: Number(result.shippingFee ?? 0),
    currency: typeof result.currency === "string" ? result.currency : "KES",
    funnelId: typeof result.funnelId === "string" ? result.funnelId : null,
  };
}

export async function trackOrderImpl(rawNumber: unknown, rawContact: unknown) {
  const number = text(rawNumber, 40).toUpperCase();
  const contact = text(rawContact, 160).toLowerCase();
  if (!number || !contact) throw new Error("Order number and phone or email are required.");

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: order, error } = await supabaseAdmin
    .from("dg_orders")
    .select(
      "id,order_number,status,payment_status,total,currency,placed_at,delivered_at,tracking_number,shipping_method,customer_id",
    )
    .eq("order_number", number)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw error;
  if (!order) throw new Error("No order found with that number.");

  const { data: customer } = await supabaseAdmin
    .from("dg_customers")
    .select("email,phone")
    .eq("id", order.customer_id ?? "")
    .maybeSingle();

  const matches =
    (customer?.email ?? "").toLowerCase() === contact ||
    (customer?.phone ?? "").toLowerCase() === contact;
  if (!matches) throw new Error("No order found with that number.");

  const { data: events } = await supabaseAdmin
    .from("dg_order_events")
    .select("id,type,title,occurred_at")
    .eq("order_id", order.id)
    .order("occurred_at", { ascending: false });

  return {
    orderNumber: order.order_number,
    status: order.status,
    paymentStatus: order.payment_status,
    total: Number(order.total),
    currency: order.currency,
    placedAt: order.placed_at,
    deliveredAt: order.delivered_at,
    trackingNumber: order.tracking_number,
    shippingMethod: order.shipping_method,
    events: events ?? [],
  };
}
