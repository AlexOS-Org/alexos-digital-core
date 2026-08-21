import type { Json } from "@/integrations/supabase/types";

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
}

const PAYMENT_METHODS = new Set(["cod", "mpesa", "card", "bank_transfer"]);

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
    return { productId, variantId: variantId || null, quantity: Math.floor(quantity) };
  });

  const email = text(input["email"], 160);

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
  };
}

export async function placeGuestOrderImpl(input: GuestOrderInput) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.rpc("dg_create_guest_order", {
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
  });
  if (error) throw error;

  const result = data as {
    orderNumber?: unknown;
    total?: unknown;
    subtotal?: unknown;
    shippingFee?: unknown;
    currency?: unknown;
  } | null;
  if (!result || typeof result.orderNumber !== "string") {
    throw new Error("The order was not created. Please try again.");
  }

  return {
    orderNumber: result.orderNumber,
    total: Number(result.total ?? 0),
    subtotal: Number(result.subtotal ?? 0),
    shippingFee: Number(result.shippingFee ?? 0),
    currency: typeof result.currency === "string" ? result.currency : "KES",
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
