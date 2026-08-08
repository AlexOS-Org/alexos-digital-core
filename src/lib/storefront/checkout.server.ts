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

function orderNumber() {
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `DG-${stamp}-${Math.floor(Math.random() * 9000 + 1000)}`;
}

// Deterministic, collision-free order number using the database sequence
// added by the 20260808 hardening migration (dg_order_seq). Falls back to the
// legacy random format if the sequence is unavailable (older environments).
async function nextOrderNumber(
  adminClient: Awaited<
    ReturnType<typeof import("@/integrations/supabase/client.server").createSupabaseAdminClient>
  >,
) {
  const { data, error } = await adminClient.rpc("next_order_number");
  if (!error && typeof data === "string" && data.startsWith("DG-")) {
    return data;
  }
  return orderNumber();
}

export async function placeGuestOrderImpl(input: GuestOrderInput) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: store, error: storeError } = await supabaseAdmin
    .from("dg_storefronts")
    .select("id,user_id,currency,flat_shipping_fee,free_shipping_threshold,published")
    .eq("slug", input.storeSlug)
    .eq("published", true)
    .maybeSingle();
  if (storeError) throw storeError;
  if (!store) throw new Error("This store is not accepting orders right now.");

  const ownerId = store.user_id;
  const productIds = [...new Set(input.items.map((i) => i.productId))];

  const { data: products, error: productError } = await supabaseAdmin
    .from("dg_products")
    .select("id,name,sku,price,sale_price,cost_price,stock_quantity,status")
    .eq("user_id", ownerId)
    .is("deleted_at", null)
    .in("id", productIds);
  if (productError) throw productError;

  const byId = new Map((products ?? []).map((p) => [p.id, p]));

  const lines = input.items.map((item) => {
    const product = byId.get(item.productId);
    if (!product || product.status !== "active") {
      throw new Error("One of the products is no longer available.");
    }
    if (Number(product.stock_quantity) < item.quantity) {
      throw new Error(`Only ${product.stock_quantity} left of ${product.name}.`);
    }
    const base = Number(product.price);
    const sale = product.sale_price == null ? null : Number(product.sale_price);
    const unitPrice = sale != null && sale > 0 && sale < base ? sale : base;
    return {
      product,
      variantId: item.variantId,
      quantity: item.quantity,
      unitPrice,
      unitCost: Number(product.cost_price ?? 0),
    };
  });

  const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  const threshold = Number(store.free_shipping_threshold ?? 0);
  const shippingFee =
    threshold > 0 && subtotal >= threshold ? 0 : Number(store.flat_shipping_fee ?? 0);
  const total = subtotal + shippingFee;

  // Reuse an existing customer for this phone number so lifetime value stays intact.
  const { data: existingCustomer } = await supabaseAdmin
    .from("dg_customers")
    .select("id")
    .eq("user_id", ownerId)
    .eq("phone", input.phone)
    .is("deleted_at", null)
    .maybeSingle();

  let customerId = existingCustomer?.id ?? null;
  if (!customerId) {
    const { data: created, error: customerError } = await supabaseAdmin
      .from("dg_customers")
      .insert({
        user_id: ownerId,
        first_name: input.firstName,
        last_name: input.lastName,
        email: input.email,
        phone: input.phone,
        address: input.address,
        city: input.city,
      })
      .select("id")
      .single();
    if (customerError) throw customerError;
    customerId = created.id;
  }

  const number = await nextOrderNumber(supabaseAdmin);
  const { data: order, error: orderError } = await supabaseAdmin
    .from("dg_orders")
    .insert({
      user_id: ownerId,
      order_number: number,
      customer_id: customerId,
      status: "new",
      payment_status: input.paymentMethod === "cod" ? "unpaid" : "unpaid",
      payment_method: input.paymentMethod,
      channel: "online_store",
      subtotal,
      discount: 0,
      tax: 0,
      shipping_fee: shippingFee,
      total,
      currency: store.currency,
      shipping_address: [input.address, input.city].filter(Boolean).join(", "),
      notes: input.notes,
    })
    .select("id,order_number")
    .single();
  if (orderError) throw orderError;

  const { error: itemsError } = await supabaseAdmin.from("dg_order_items").insert(
    lines.map((l) => ({
      user_id: ownerId,
      order_id: order.id,
      product_id: l.product.id,
      variant_id: l.variantId,
      name: l.product.name,
      sku: l.product.sku,
      quantity: l.quantity,
      unit_price: l.unitPrice,
      unit_cost: l.unitCost,
      discount: 0,
      total: l.unitPrice * l.quantity,
    })),
  );
  if (itemsError) throw itemsError;

  // Atomic, race-safe stock reservation (see dg_reserve_stock in the
  // 20260808 hardening migration). Under concurrent checkouts the database
  // constraint guarantees stock never goes negative and two orders can never
  // oversell the last unit.
  for (const line of lines) {
    const { data: reserved, error: reserveError } = await supabaseAdmin.rpc("dg_reserve_stock", {
      p_product_id: line.product.id,
      p_qty: line.quantity,
    });
    if (reserveError || reserved !== true) {
      throw new Error(`Only ${line.product.stock_quantity} left of ${line.product.name}.`);
    }
  }

  await supabaseAdmin.from("dg_stock_movements").insert(
    lines.map((l) => ({
      user_id: ownerId,
      product_id: l.product.id,
      variant_id: l.variantId,
      type: "sale" as const,
      quantity: -l.quantity,
      unit_cost: l.unitCost,
      reference: order.id,
    })),
  );

  await supabaseAdmin.from("dg_order_events").insert({
    user_id: ownerId,
    order_id: order.id,
    type: "created",
    title: "Order placed on the online store",
    body: `${lines.length} item(s) · ${store.currency} ${total}`,
  });

  return {
    orderNumber: order.order_number,
    total,
    subtotal,
    shippingFee,
    currency: store.currency,
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
