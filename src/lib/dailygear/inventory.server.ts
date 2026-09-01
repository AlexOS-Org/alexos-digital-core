import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

/**
 * Owner-controlled stock adjustment.
 *
 * DailyGear stores stock as the authoritative `dg_products.stock_quantity`
 * column and keeps `dg_stock_movements` as the audit trail. A movement alone is
 * not enough: recording a purchase, return or damage must also change the
 * product's sellable level. This server function keeps the two consistent and
 * fails closed before a removal would drive stock negative.
 */

export const STOCK_MOVEMENT_TYPES = [
  "purchase",
  "sale",
  "adjustment",
  "transfer_in",
  "transfer_out",
  "return",
  "damage",
] as const;

export type StockMovementType = (typeof STOCK_MOVEMENT_TYPES)[number];

const INBOUND_TYPES = new Set<StockMovementType>([
  "purchase",
  "return",
  "adjustment",
  "transfer_in",
]);
const OUTBOUND_TYPES = new Set<StockMovementType>(["sale", "transfer_out", "damage"]);

export interface StockMovementInput {
  productId: string;
  variantId?: string | null;
  type: StockMovementType;
  quantity: number;
  reference?: string | null;
  unitCost?: number | null;
}

function text(value: unknown, max = 200): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function validateStockMovementRequest(raw: unknown): StockMovementInput {
  const input = (raw ?? {}) as Record<string, unknown>;
  const productId = text(input["productId"], 60);
  const type = text(input["type"], 20) as StockMovementType;
  const variantId = text(input["variantId"], 60) || null;
  const reference = text(input["reference"], 200) || null;
  const quantityNumber = Number(input["quantity"]);
  const rawUnitCost = Number(input["unitCost"]);

  if (!productId) throw new Error("A product is required.");
  if (!STOCK_MOVEMENT_TYPES.includes(type)) throw new Error("Unsupported movement type.");
  if (!Number.isInteger(quantityNumber) || quantityNumber === 0) {
    throw new Error("Quantity must be a whole number other than zero.");
  }

  const quantity = Math.trunc(quantityNumber);
  const inbound = INBOUND_TYPES.has(type);
  const outbound = OUTBOUND_TYPES.has(type);
  if (inbound && quantity < 0) {
    throw new Error("This movement type can only add stock.");
  }
  if (outbound && quantity > 0) {
    throw new Error("This movement type can only remove stock.");
  }

  return {
    productId,
    variantId,
    type,
    quantity,
    reference,
    unitCost: Number.isFinite(rawUnitCost) ? rawUnitCost : null,
  };
}

export function isOutboundMovement(input: Pick<StockMovementInput, "type" | "quantity">): boolean {
  return OUTBOUND_TYPES.has(input.type) || input.quantity < 0;
}

interface RecordContext {
  supabase: SupabaseClient<Database>;
  userId: string;
}

export async function recordStockMovementImpl(input: StockMovementInput, ctx: RecordContext) {
  const { supabase, userId } = ctx;
  const productId = input.productId;

  const outbound = isOutboundMovement(input);
  const quantity = Math.abs(Math.trunc(input.quantity));

  // Insert the audit trail first so a stock change can never happen without a
  // movement record. If the guarded stock update fails, the audit row is
  // removed again so no phantom movement remains.
  const { data: movement, error: movementError } = await supabase
    .from("dg_stock_movements")
    .insert({
      user_id: userId,
      product_id: productId,
      variant_id: input.variantId ?? null,
      type: input.type,
      quantity: outbound ? -quantity : quantity,
      unit_cost: input.unitCost ?? null,
      reference: input.reference ?? null,
    })
    .select("id")
    .single();
  if (movementError) throw movementError;

  try {
    const { data: current, error: currentError } = await supabase
      .from("dg_products")
      .select("id,stock_quantity")
      .eq("id", productId)
      .maybeSingle();
    if (currentError) throw currentError;
    if (!current) throw new Error("Product not found or ownership required.");

    const currentStock = Number(current.stock_quantity ?? 0);
    const next = outbound ? currentStock - quantity : currentStock + quantity;
    if (next < 0) {
      throw new Error(`Cannot remove ${quantity}: only ${currentStock} in stock.`);
    }

    // Use the current row value as an optimistic concurrency guard. A null
    // stock means unconfigured; an inbound adjustment establishes it while an
    // outbound adjustment has nothing to remove.
    const stockQuery =
      current.stock_quantity === null
        ? supabase.from("dg_products").update({ stock_quantity: next }).is("stock_quantity", null)
        : supabase
            .from("dg_products")
            .update({ stock_quantity: next })
            .eq("stock_quantity", currentStock);
    const { data: updated, error: updateError } = await stockQuery
      .eq("id", productId)
      .select("id")
      .maybeSingle();
    if (updateError) throw updateError;
    if (!updated) {
      throw new Error("Stock changed while adjusting. Please try again.");
    }
  } catch (error) {
    // Roll back the audit row so a failed adjustment never leaves a phantom
    // movement attached to a stock level that was not changed.
    await supabase.from("dg_stock_movements").delete().eq("id", movement.id);
    throw error;
  }

  return { movementId: movement.id, productId, quantity: outbound ? -quantity : quantity };
}
