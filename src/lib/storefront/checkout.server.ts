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
  country: string;
  county: string;
  town: string;
  deliveryDetails?: string | null;
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
  const country = text(input["country"], 80);
  const county = text(input["county"], 100);
  const town = text(input["town"], 100);
  const deliveryDetails = text(input["deliveryDetails"], 500);
  const storeSlug = text(input["storeSlug"], 80);
  const paymentMethod = text(input["paymentMethod"], 40) || "cod";
  const items = Array.isArray(input["items"]) ? input["items"] : [];

  if (!firstName) throw new Error("First name is required.");
  if (phone.length < 7) throw new Error("A valid phone number is required.");
  if (!address) throw new Error("A delivery address is required.");
  if (country.toLowerCase() !== "kenya")
    throw new Error("DailyGear currently delivers within Kenya only.");
  if (!county) throw new Error("Select a delivery county.");
  if (!town) throw new Error("Select a delivery town.");
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
    country: "Kenya",
    county,
    town,
    deliveryDetails: deliveryDetails || null,
    city: town,
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

export function buildGuestOrderRpcItems(items: GuestOrderLineInput[]) {
  return items.map((item) => ({
    product_id: item.productId,
    variant_id: item.variantId ?? null,
    quantity: item.quantity,
    offer_role: item.offerRole ?? "primary",
    funnel_step_id: item.funnelStepId ?? null,
  }));
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
    p_city: input.town,
    p_country: input.country,
    p_county: input.county,
    p_town: input.town,
    p_delivery_details: input.deliveryDetails ?? null,
    p_notes: input.notes ?? null,
    p_payment_method: input.paymentMethod,
    p_items: buildGuestOrderRpcItems(input.items) as unknown as Json,
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

  const { data: storefront } = await supabaseAdmin
    .from("dg_storefronts")
    .select("support_email")
    .eq("slug", input.storeSlug)
    .maybeSingle();
  const { data: createdOrder } = await supabaseAdmin
    .from("dg_orders")
    .select("id")
    .eq("order_number", result.orderNumber)
    .maybeSingle();
  const { data: createdItems } = createdOrder
    ? await supabaseAdmin
        .from("dg_order_items")
        .select("name,sku,quantity,total,product_id,variant_id")
        .eq("order_id", createdOrder.id)
    : { data: null };
  const notificationItems = createdItems
    ? await (async () => {
        const productIds = createdItems.map((item) => item.product_id).filter(Boolean) as string[];
        const variantIds = createdItems.map((item) => item.variant_id).filter(Boolean) as string[];
        const [{ data: products }, { data: variants }] = await Promise.all([
          productIds.length
            ? supabaseAdmin.from("dg_products").select("id,images").in("id", productIds)
            : Promise.resolve({ data: [] }),
          variantIds.length
            ? supabaseAdmin.from("dg_product_variants").select("id,image_url").in("id", variantIds)
            : Promise.resolve({ data: [] }),
        ]);
        const productImages = new Map(
          (products ?? []).map((product) => [product.id, product.images?.[0] ?? null]),
        );
        const variantImages = new Map(
          (variants ?? []).map((variant) => [variant.id, variant.image_url ?? null]),
        );
        return createdItems.map((item) => ({
          name: item.name,
          sku: item.sku,
          quantity: Number(item.quantity ?? 0),
          lineTotal: Number(item.total ?? 0),
          imageUrl:
            (item.variant_id ? variantImages.get(item.variant_id) : null) ??
            (item.product_id ? productImages.get(item.product_id) : null),
        }));
      })()
    : null;
  try {
    const { sendOrderNotifications } = await import("@/server/notifications/order-email");
    const notification = await sendOrderNotifications({
      orderNumber: result.orderNumber,
      total: Number(result.total ?? 0),
      shippingFee: Number(result.shippingFee ?? 0),
      currency: typeof result.currency === "string" ? result.currency : "KES",
      paymentMethod: input.paymentMethod,
      customerName: [input.firstName, input.lastName].filter(Boolean).join(" "),
      customerEmail: input.email ?? null,
      customerPhone: input.phone,
      county: input.county,
      town: input.town,
      address: input.address,
      deliveryDetails: input.deliveryDetails ?? null,
      ownerEmail: storefront?.support_email ?? null,
      items:
        notificationItems ??
        input.items.map((item) => ({
          name: item.productId,
          sku: item.variantId ?? null,
          quantity: item.quantity,
          lineTotal: 0,
          imageUrl: null,
        })),
    });
    if (!notification.sent)
      console.warn(`[DailyGear] Order notification skipped: ${notification.reason}`);
  } catch (notificationError) {
    console.warn(
      "[DailyGear] Order created but notification delivery failed",
      notificationError instanceof Error ? notificationError.message : notificationError,
    );
  }

  return {
    orderNumber: result.orderNumber,
    total: Number(result.total ?? 0),
    subtotal: Number(result.subtotal ?? 0),
    shippingFee: Number(result.shippingFee ?? 0),
    currency: typeof result.currency === "string" ? result.currency : "KES",
    funnelId: typeof result.funnelId === "string" ? result.funnelId : null,
    confirmation: {
      customerName: [input.firstName, input.lastName].filter(Boolean).join(" "),
      customerEmail: input.email ?? null,
      customerPhone: input.phone,
      paymentMethod: input.paymentMethod,
      shippingMethod: "Delivery",
      shippingCounty: input.county,
      shippingTown: input.town,
      shippingAddress: input.address,
      shippingAddressDetails: input.deliveryDetails ?? null,
      items:
        createdItems?.map((item) => ({
          name: item.name,
          quantity: Number(item.quantity ?? 0),
          total: Number(item.total ?? 0),
        })) ??
        input.items.map((item) => ({ name: item.productId, quantity: item.quantity, total: 0 })),
      paymentInstructions: /m-?pesa/i.test(input.paymentMethod)
        ? { paybill: "542542", account: "184545", amount: Number(result.total ?? 0) }
        : null,
    },
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
      "id,order_number,status,payment_status,total,currency,placed_at,delivered_at,tracking_number,shipping_method,payment_method,shipping_address,shipping_country,shipping_county,shipping_town,shipping_address_details,customer_id",
    )
    .eq("order_number", number)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw error;
  if (!order) throw new Error("No order found with that number.");

  const { data: customer } = await supabaseAdmin
    .from("dg_customers")
    .select("first_name,last_name,email,phone")
    .eq("id", order.customer_id ?? "")
    .maybeSingle();

  const matches =
    (customer?.email ?? "").toLowerCase() === contact ||
    (customer?.phone ?? "").toLowerCase() === contact;
  if (!matches) throw new Error("No order found with that number.");

  const [{ data: events }, { data: items }] = await Promise.all([
    supabaseAdmin
      .from("dg_order_events")
      .select("id,type,title,occurred_at")
      .eq("order_id", order.id)
      .order("occurred_at", { ascending: false }),
    supabaseAdmin
      .from("dg_order_items")
      .select("name,sku,quantity,total")
      .eq("order_id", order.id)
      .order("created_at", { ascending: true }),
  ]);

  return {
    orderNumber: order.order_number,
    customerName: [customer?.first_name, customer?.last_name].filter(Boolean).join(" ") || null,
    customerEmail: customer?.email ?? null,
    customerPhone: customer?.phone ?? null,
    status: order.status,
    paymentStatus: order.payment_status,
    total: Number(order.total),
    currency: order.currency,
    placedAt: order.placed_at,
    deliveredAt: order.delivered_at,
    trackingNumber: order.tracking_number,
    shippingMethod: order.shipping_method,
    paymentMethod: order.payment_method,
    shippingAddress: order.shipping_address,
    shippingCountry: order.shipping_country,
    shippingCounty: order.shipping_county,
    shippingTown: order.shipping_town,
    shippingAddressDetails: order.shipping_address_details,
    paymentInstructions:
      order.payment_method?.toLowerCase().includes("m-pesa") ||
      order.payment_method?.toLowerCase().includes("mpesa")
        ? { paybill: "542542", account: "184545", amount: Number(order.total) }
        : null,
    items: (items ?? []).map((item) => ({
      name: item.name,
      sku: item.sku,
      quantity: item.quantity,
      total: Number(item.total),
    })),
    events: events ?? [],
  };
}
