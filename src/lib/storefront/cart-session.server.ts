import type { Json } from "@/integrations/supabase/types";
import type { FunnelOfferRole } from "@/lib/dailygear/types";

export interface CartRecoveryLineInput {
  productId: string;
  variantId: string | null;
  quantity: number;
  offerRole?: FunnelOfferRole;
  funnelStepId?: string | null;
}

export interface SaveCartSessionInput {
  storeSlug: string;
  sessionToken?: string | null;
  email: string;
  firstName?: string | null;
  phone?: string | null;
  items: CartRecoveryLineInput[];
  subtotal?: number;
  currency?: string;
  consent: boolean;
}

export interface RecoveryCartLine {
  productId: string;
  variantId: string | null;
  name: string;
  sku: string | null;
  price: number;
  image: string | null;
  quantity: number;
  maxQuantity: number;
  offerRole?: FunnelOfferRole;
  funnelStepId?: string | null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TOKEN_RE = /^[a-f0-9]{64}$/i;
const MAX_ITEMS = 50;

function text(value: unknown, max = 200) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function validId(value: unknown) {
  return text(value, 80);
}

function normalizeEmail(value: unknown) {
  const email = text(value, 320).toLowerCase();
  return EMAIL_RE.test(email) ? email : "";
}

function normalizeItems(value: unknown): CartRecoveryLineInput[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_ITEMS) return [];
  return value.map((entry) => {
    const item = (entry ?? {}) as Record<string, unknown>;
    const productId = validId(item["productId"]);
    const variantId = validId(item["variantId"]) || null;
    const quantity = Number(item["quantity"]);
    const rawOfferRole = text(item["offerRole"], 20);
    const offerRole: FunnelOfferRole = ["primary", "order_bump", "upsell", "downsell"].includes(
      rawOfferRole,
    )
      ? (rawOfferRole as FunnelOfferRole)
      : "primary";
    const funnelStepId = validId(item["funnelStepId"]) || null;
    if (!productId || !Number.isFinite(quantity) || quantity < 1 || quantity > 999) {
      throw new Error("An item in your bag is invalid.");
    }
    return {
      productId,
      variantId,
      quantity: Math.floor(quantity),
      offerRole,
      funnelStepId,
    };
  });
}

export function validateSaveCartSession(raw: unknown): SaveCartSessionInput {
  const input = (raw ?? {}) as Record<string, unknown>;
  const consent = input["consent"] === true;
  const email = normalizeEmail(input["email"]);
  const storeSlug = text(input["storeSlug"], 120);
  const items = normalizeItems(input["items"]);
  if (!consent) throw new Error("A reminder must be explicitly selected.");
  if (!email) throw new Error("A valid email is required for the reminder.");
  if (!storeSlug) throw new Error("Store could not be identified.");
  if (items.length === 0) throw new Error("Your bag is empty.");

  const subtotal = Number(input["subtotal"] ?? 0);
  return {
    storeSlug,
    sessionToken: TOKEN_RE.test(text(input["sessionToken"], 100))
      ? text(input["sessionToken"], 100).toLowerCase()
      : null,
    email,
    firstName: text(input["firstName"], 80) || null,
    phone: text(input["phone"], 40) || null,
    items,
    subtotal: Number.isFinite(subtotal) && subtotal >= 0 ? subtotal : 0,
    currency: /^[A-Z]{3}$/.test(text(input["currency"], 3)) ? text(input["currency"], 3) : "KES",
    consent,
  };
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function randomRecoveryToken() {
  return globalThis.crypto.randomUUID();
}

function sellingPrice(item: { price: number | string | null; sale_price: number | string | null }) {
  const base = Number(item.price ?? 0);
  const sale = item.sale_price == null ? null : Number(item.sale_price);
  return sale != null && sale > 0 && sale < base ? sale : base;
}

async function getPublishedStore(storeSlug: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("dg_storefronts")
    .select("id,user_id,slug,currency,published")
    .eq("slug", storeSlug)
    .eq("published", true)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Storefront is not available.");
  return data;
}

async function resolveRecoveryItems(
  storeUserId: string,
  items: CartRecoveryLineInput[],
): Promise<{ lines: RecoveryCartLine[]; subtotal: number }> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const productIds = [...new Set(items.map((item) => item.productId))];
  const variantIds = [
    ...new Set(items.flatMap((item) => (item.variantId ? [item.variantId] : []))),
  ];

  const { data: products, error: productError } = await supabaseAdmin
    .from("dg_products")
    .select("id,name,sku,price,sale_price,images,stock_quantity,status,user_id")
    .in("id", productIds)
    .eq("user_id", storeUserId)
    .eq("status", "active")
    .is("deleted_at", null);
  if (productError) throw productError;

  const { data: variants, error: variantError } = variantIds.length
    ? await supabaseAdmin
        .from("dg_product_variants")
        .select("id,product_id,name,sku,price,sale_price,image_url,stock_quantity,deleted_at")
        .in("id", variantIds)
        .is("deleted_at", null)
    : { data: [], error: null };
  if (variantError) throw variantError;

  const productById = new Map((products ?? []).map((product) => [product.id, product]));
  const variantById = new Map((variants ?? []).map((variant) => [variant.id, variant]));
  const lines: RecoveryCartLine[] = [];

  for (const item of items) {
    const product = productById.get(item.productId);
    if (!product) continue;
    const variant = item.variantId ? variantById.get(item.variantId) : null;
    if (item.variantId && (!variant || variant.product_id !== product.id)) continue;

    const maxQuantity = Math.max(0, Number(variant?.stock_quantity ?? product.stock_quantity ?? 0));
    if (maxQuantity <= 0) continue;
    const quantity = Math.min(item.quantity, maxQuantity);
    const images = (product.images ?? []) as string[];
    const price = sellingPrice(variant ?? product);
    lines.push({
      productId: product.id,
      variantId: variant?.id ?? null,
      name: variant ? `${product.name} — ${variant.name}` : product.name,
      sku: variant?.sku ?? product.sku,
      price,
      image: variant?.image_url ?? images[0] ?? null,
      quantity,
      maxQuantity,
      offerRole: item.offerRole ?? "primary",
      funnelStepId: item.funnelStepId ?? null,
    });
  }

  return {
    lines,
    subtotal: lines.reduce((sum, line) => sum + line.price * line.quantity, 0),
  };
}

export async function saveCartSessionImpl(input: SaveCartSessionInput) {
  if (!input.consent) return { saved: false as const, reason: "not_opted_in" as const };
  const store = await getPublishedStore(input.storeSlug);
  const resolved = await resolveRecoveryItems(store.user_id, input.items);
  if (resolved.lines.length === 0)
    return { saved: false as const, reason: "no_available_items" as const };

  const sessionTokenHash =
    input.sessionToken && TOKEN_RE.test(input.sessionToken)
      ? input.sessionToken.toLowerCase()
      : await sha256(randomRecoveryToken());
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: existing, error: existingError } = await supabaseAdmin
    .from("dg_cart_sessions")
    .select("id,status,follow_up_sent_at")
    .eq("session_token_hash", sessionTokenHash)
    .maybeSingle();
  if (existingError) throw existingError;

  if (existing && (existing.status !== "pending" || existing.follow_up_sent_at)) {
    return {
      saved: true as const,
      sessionToken: sessionTokenHash,
      alreadySent: true as const,
    };
  }

  const now = new Date().toISOString();
  const values = {
    storefront_id: store.id,
    store_slug: store.slug,
    session_token_hash: sessionTokenHash,
    email: input.email,
    first_name: input.firstName ?? null,
    phone: input.phone ?? null,
    cart_json: input.items as unknown as Json,
    subtotal: resolved.subtotal,
    currency: store.currency || input.currency || "KES",
    status: "pending",
    consent_at: now,
    updated_at: now,
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    last_error: null,
  };

  const { error } = existing
    ? await supabaseAdmin
        .from("dg_cart_sessions")
        .update(values)
        .eq("id", existing.id)
        .eq("status", "pending")
        .is("follow_up_sent_at", null)
    : await supabaseAdmin.from("dg_cart_sessions").insert(values);
  if (error) throw error;

  return { saved: true as const, sessionToken: sessionTokenHash, alreadySent: false as const };
}

export async function loadCartSessionImpl(sessionToken: string) {
  if (!TOKEN_RE.test(sessionToken)) return null;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: session, error } = await supabaseAdmin
    .from("dg_cart_sessions")
    .select("store_slug,storefront_id,email,first_name,phone,cart_json,expires_at,status")
    .eq("session_token_hash", sessionToken.toLowerCase())
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  if (error) throw error;
  if (!session) return null;

  const { data: store, error: storeError } = await supabaseAdmin
    .from("dg_storefronts")
    .select("user_id")
    .eq("id", session.storefront_id)
    .maybeSingle();
  if (storeError) throw storeError;
  if (!store) return null;

  const parsedItems = normalizeItems(session.cart_json);
  const resolved = await resolveRecoveryItems(store.user_id, parsedItems);
  if (resolved.lines.length === 0) return null;

  return {
    sessionToken: sessionToken.toLowerCase(),
    storeSlug: session.store_slug,
    email: session.email,
    firstName: session.first_name,
    phone: session.phone,
    items: resolved.lines,
  };
}

export async function markCartSessionConvertedImpl(storeSlug: string, sessionToken: string) {
  if (!TOKEN_RE.test(sessionToken)) return;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const now = new Date().toISOString();
  const { error } = await supabaseAdmin
    .from("dg_cart_sessions")
    .update({ status: "converted", converted_at: now, updated_at: now })
    .eq("store_slug", storeSlug)
    .eq("session_token_hash", sessionToken.toLowerCase())
    .eq("status", "pending");
  if (error) throw error;
}

export async function getAbandonedCartCandidates(limit = 25) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const cutoff = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const claimCutoff = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { data, error } = await supabaseAdmin
    .from("dg_cart_sessions")
    .select(
      "id,store_slug,storefront_id,session_token_hash,email,first_name,cart_json,currency,follow_up_claimed_at",
    )
    .eq("status", "pending")
    .is("follow_up_sent_at", null)
    .lt("created_at", cutoff)
    .gt("expires_at", new Date().toISOString())
    .or(`follow_up_claimed_at.is.null,follow_up_claimed_at.lt.${claimCutoff}`)
    .order("created_at", { ascending: true })
    .limit(Math.min(Math.max(limit, 1), 50));
  if (error) throw error;
  return data ?? [];
}

export async function claimCartSession(id: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const now = new Date().toISOString();
  const claimCutoff = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { data, error } = await supabaseAdmin
    .from("dg_cart_sessions")
    .update({ follow_up_claimed_at: now, updated_at: now })
    .eq("id", id)
    .eq("status", "pending")
    .is("follow_up_sent_at", null)
    .or(`follow_up_claimed_at.is.null,follow_up_claimed_at.lt.${claimCutoff}`)
    .select("id,store_slug,storefront_id,session_token_hash,email,first_name,cart_json,currency")
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function expireCartSession(id: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const now = new Date().toISOString();
  const { error } = await supabaseAdmin
    .from("dg_cart_sessions")
    .update({ status: "expired", follow_up_claimed_at: null, updated_at: now })
    .eq("id", id)
    .eq("status", "pending");
  if (error) throw error;
}

export async function markCartSessionFollowUpSent(id: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const now = new Date().toISOString();
  const { error } = await supabaseAdmin
    .from("dg_cart_sessions")
    .update({
      follow_up_sent_at: now,
      follow_up_claimed_at: null,
      last_error: null,
      updated_at: now,
    })
    .eq("id", id)
    .eq("status", "pending")
    .is("follow_up_sent_at", null);
  if (error) throw error;
}

export async function markCartSessionFollowUpFailed(id: string, errorMessage: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const now = new Date().toISOString();
  await supabaseAdmin
    .from("dg_cart_sessions")
    .update({
      follow_up_claimed_at: null,
      last_error: errorMessage.slice(0, 500),
      updated_at: now,
    })
    .eq("id", id)
    .eq("status", "pending")
    .is("follow_up_sent_at", null);
}

export async function resolveSessionCartForEmail(storefrontId: string, rawItems: unknown) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: store, error } = await supabaseAdmin
    .from("dg_storefronts")
    .select("user_id")
    .eq("id", storefrontId)
    .maybeSingle();
  if (error) throw error;
  if (!store) return { lines: [], subtotal: 0 };
  return resolveRecoveryItems(store.user_id, normalizeItems(rawItems));
}
