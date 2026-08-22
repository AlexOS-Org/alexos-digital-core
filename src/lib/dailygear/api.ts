import { useMutation, useQuery, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatMoney } from "@/lib/money/format";
import type {
  Category,
  Brand,
  Supplier,
  Warehouse,
  Product,
  ProductVariant,
  Customer,
  Order,
  OrderItem,
  OrderEvent,
  StockMovement,
  ProductEvidence,
  Funnel,
  FunnelStep,
} from "./types";

/**
 * Generic, soft-delete-aware resource layer.
 *
 * Every DailyGear table follows the same shape (user_id, deleted_at,
 * created_at), so CRUD is expressed once and specialised per table. Adding a
 * new entity is a single `createResource` call — no copy-pasted hooks.
 */
type DgTable =
  | "dg_categories"
  | "dg_brands"
  | "dg_suppliers"
  | "dg_warehouses"
  | "dg_products"
  | "dg_product_variants"
  | "dg_customers"
  | "dg_orders"
  | "dg_order_items"
  | "dg_order_events"
  | "dg_stock_movements"
  | "dg_product_evidence"
  | "dg_funnels"
  | "dg_funnel_steps";

const SOFT_DELETE_TABLES = new Set<DgTable>([
  "dg_categories",
  "dg_brands",
  "dg_suppliers",
  "dg_warehouses",
  "dg_products",
  "dg_product_variants",
  "dg_customers",
  "dg_orders",
]);

async function requireUserId() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("You must be signed in.");
  return data.user.id;
}

interface ResourceOptions {
  orderBy?: { column: string; ascending?: boolean };
  select?: string;
}

function createResource<Row>(table: DgTable, options: ResourceOptions = {}) {
  const key: QueryKey = ["dailygear", table];
  const softDelete = SOFT_DELETE_TABLES.has(table);

  function useList(filters?: Record<string, string | null | undefined>, enabled = true) {
    return useQuery({
      queryKey: [...key, filters ?? null],
      enabled,
      queryFn: async () => {
        let q = supabase.from(table).select(options.select ?? "*");
        if (softDelete) q = q.is("deleted_at", null);
        for (const [column, value] of Object.entries(filters ?? {})) {
          if (value === undefined || value === null || value === "") continue;
          q = q.eq(column, value);
        }
        const ob = options.orderBy ?? { column: "created_at", ascending: false };
        q = q.order(ob.column, { ascending: ob.ascending ?? false });
        const { data, error } = await q;
        if (error) throw error;
        return (data ?? []) as unknown as Row[];
      },
    });
  }

  function useSave(label: string) {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: async (values: Record<string, unknown> & { id?: string }) => {
        const { id, ...rest } = values;
        if (id) {
          const { data, error } = await supabase
            .from(table)
            .update(rest as never)
            .eq("id", id)
            .select()
            .single();
          if (error) throw error;
          return data as unknown as Row;
        }
        const user_id = await requireUserId();
        const { data, error } = await supabase
          .from(table)
          .insert({ ...rest, user_id } as never)
          .select()
          .single();
        if (error) throw error;
        return data as unknown as Row;
      },
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: key });
        toast.success(`${label} saved`);
      },
      onError: (e: Error) => toast.error(e.message),
    });
  }

  function useRemove(label: string) {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: async (id: string) => {
        const { error } = softDelete
          ? await supabase
              .from(table)
              .update({ deleted_at: new Date().toISOString() } as never)
              .eq("id", id)
          : await supabase.from(table).delete().eq("id", id);
        if (error) throw error;
        return id;
      },
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: key });
        toast.success(`${label} removed`);
      },
      onError: (e: Error) => toast.error(e.message),
    });
  }

  return { key, useList, useSave, useRemove };
}

export const productsResource = createResource<Product>("dg_products", {
  orderBy: { column: "created_at", ascending: false },
});
export const variantsResource = createResource<ProductVariant>("dg_product_variants", {
  orderBy: { column: "sort_order", ascending: true },
});
export const categoriesResource = createResource<Category>("dg_categories", {
  orderBy: { column: "sort_order", ascending: true },
});
export const brandsResource = createResource<Brand>("dg_brands", {
  orderBy: { column: "name", ascending: true },
});
export const suppliersResource = createResource<Supplier>("dg_suppliers", {
  orderBy: { column: "name", ascending: true },
});
export const warehousesResource = createResource<Warehouse>("dg_warehouses", {
  orderBy: { column: "name", ascending: true },
});
export const customersResource = createResource<Customer>("dg_customers", {
  orderBy: { column: "created_at", ascending: false },
});
export const ordersResource = createResource<Order>("dg_orders", {
  orderBy: { column: "placed_at", ascending: false },
});
export const orderItemsResource = createResource<OrderItem>("dg_order_items", {
  orderBy: { column: "created_at", ascending: true },
});
export const orderEventsResource = createResource<OrderEvent>("dg_order_events", {
  orderBy: { column: "occurred_at", ascending: false },
});
export const stockMovementsResource = createResource<StockMovement>("dg_stock_movements", {
  orderBy: { column: "occurred_at", ascending: false },
});
export const productEvidenceResource = createResource<ProductEvidence>("dg_product_evidence", {
  orderBy: { column: "created_at", ascending: false },
});
export const funnelsResource = createResource<Funnel>("dg_funnels", {
  orderBy: { column: "created_at", ascending: false },
});
export const funnelStepsResource = createResource<FunnelStep>("dg_funnel_steps", {
  orderBy: { column: "position", ascending: true },
});

/* ── Convenience hooks ────────────────────────────────────────── */

export const useProducts = productsResource.useList;
export const useSaveProduct = () => productsResource.useSave("Product");
export const useDeleteProduct = () => productsResource.useRemove("Product");

export const useCategories = categoriesResource.useList;
export const useBrands = brandsResource.useList;
export const useSuppliers = suppliersResource.useList;
export const useWarehouses = warehousesResource.useList;

export const useCustomers = customersResource.useList;
export const useSaveCustomer = () => customersResource.useSave("Customer");
export const useDeleteCustomer = () => customersResource.useRemove("Customer");

export const useOrders = ordersResource.useList;
export const useSaveOrder = () => ordersResource.useSave("Order");
export const useDeleteOrder = () => ordersResource.useRemove("Order");

export const useOrderItems = orderItemsResource.useList;
export const useOrderEvents = orderEventsResource.useList;

export const useStockMovements = stockMovementsResource.useList;
export const useSaveStockMovement = () => stockMovementsResource.useSave("Stock movement");
export const useProductEvidence = (productId?: string) =>
  productEvidenceResource.useList(productId ? { product_id: productId } : undefined);
export const useSaveProductEvidence = () => productEvidenceResource.useSave("Evidence record");
export const useDeleteProductEvidence = () => productEvidenceResource.useRemove("Evidence record");
export const useVariants = variantsResource.useList;
export const useFunnels = funnelsResource.useList;
export const useSaveFunnel = () => funnelsResource.useSave("Funnel");
export const useDeleteFunnel = () => funnelsResource.useRemove("Funnel");
export const useFunnelSteps = (funnelId?: string) =>
  funnelStepsResource.useList(funnelId ? { funnel_id: funnelId } : undefined, Boolean(funnelId));
export const useSaveFunnelStep = () => funnelStepsResource.useSave("Funnel step");
export const useDeleteFunnelStep = () => funnelStepsResource.useRemove("Funnel step");

/** Order status change + timeline entry, kept out of the components. */
export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ order, status }: { order: Order; status: Order["status"] }) => {
      const patch = {
        status,
        ...(status === "delivered" ? { delivered_at: new Date().toISOString() } : {}),
      };
      const { error } = await supabase.from("dg_orders").update(patch).eq("id", order.id);
      if (error) throw error;
      await supabase.from("dg_order_events").insert({
        user_id: order.user_id,
        order_id: order.id,
        type: "status",
        title: `Status changed to ${status}`,
      });
      return status;
    },
    onSuccess: (status) => {
      qc.invalidateQueries({ queryKey: ["dailygear", "dg_orders"] });
      qc.invalidateQueries({ queryKey: ["dailygear", "dg_order_events"] });
      toast.success(`Order marked ${status}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export interface RefundOrVoidOrderPaymentInput {
  orderId: string;
  mode: "void" | "refund";
  refundAccountId?: string | null;
  refundAmount?: number | null;
  refundTransactionId?: string | null;
  notes?: string | null;
}

export interface RefundOrVoidOrderPaymentResult {
  order_number: string;
  mode: "void" | "refund";
  amount_reversed: number;
  refund_transaction_id: string | null;
}

export function useRefundOrVoidOrderPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: RefundOrVoidOrderPaymentInput) => {
      const { data, error } = await supabase.rpc(
        "dg_refund_or_void_order_payment" as never,
        {
          p_order_id: input.orderId,
          p_mode: input.mode,
          p_refund_account_id: input.refundAccountId ?? null,
          p_refund_amount: input.refundAmount ?? null,
          p_refund_transaction_id: input.refundTransactionId?.trim() || null,
          p_notes: input.notes?.trim() || null,
        } as never,
      );
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      if (!row) throw new Error("Refund or void returned no result.");
      return row as unknown as RefundOrVoidOrderPaymentResult;
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["dailygear"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["account_balances"] });
      toast.success(
        result.mode === "refund"
          ? `Refund recorded · ${formatMoney(result.amount_reversed)}`
          : `Payment voided · ${formatMoney(result.amount_reversed)}`,
      );
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

/* ── Composite operations ─────────────────────────────────────── */

export interface DraftOrderItem {
  product_id: string | null;
  variant_id?: string | null;
  name: string;
  sku: string | null;
  quantity: number;
  unit_price: number;
  unit_cost: number;
}

export interface DraftOrder {
  id?: string;
  customer_id: string | null;
  channel: string;
  status: Order["status"];
  payment_status: Order["payment_status"];
  payment_method: string | null;
  shipping_method: string | null;
  shipping_fee: number;
  discount: number;
  tax: number;
  shipping_address: string | null;
  shipping_country?: string | null;
  shipping_county?: string | null;
  shipping_town?: string | null;
  shipping_address_details?: string | null;
  shipping_zone?: string | null;
  notes: string | null;
  items: DraftOrderItem[];
}

export interface OrderDetailsEditInput {
  orderId: string;
  status: Order["status"];
  paymentStatus: Order["payment_status"];
  paymentMethod: string | null;
  shippingMethod: string | null;
  shippingAddress: string | null;
  shippingCountry: string | null;
  shippingCounty: string | null;
  shippingTown: string | null;
  shippingAddressDetails: string | null;
  shippingZone: string | null;
  trackingNumber: string | null;
  notes: string | null;
  internalNotes: string | null;
  customer: {
    first_name: string;
    last_name: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    country: string | null;
    county: string | null;
    town: string | null;
    delivery_details: string | null;
    notes: string | null;
  } | null;
}

export function useUpdateOrderDetails() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: OrderDetailsEditInput) => {
      const { data, error } = await supabase.rpc("dg_update_admin_order", {
        p_order_id: input.orderId,
        p_status: input.status,
        p_payment_status: input.paymentStatus,
        p_payment_method: input.paymentMethod ?? undefined,
        p_shipping_method: input.shippingMethod ?? undefined,
        p_shipping_address: input.shippingAddress ?? undefined,
        p_shipping_country: input.shippingCountry ?? undefined,
        p_shipping_county: input.shippingCounty ?? undefined,
        p_shipping_town: input.shippingTown ?? undefined,
        p_shipping_address_details: input.shippingAddressDetails ?? undefined,
        p_shipping_zone: input.shippingZone ?? undefined,
        p_tracking_number: input.trackingNumber ?? undefined,
        p_notes: input.notes ?? undefined,
        p_internal_notes: input.internalNotes ?? undefined,
        p_customer: input.customer ?? undefined,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dailygear"] });
      toast.success("Order details updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export interface OrderExpense {
  id: string;
  user_id: string;
  order_id: string;
  cost_type: "purchase_cost" | "delivery" | "other";
  amount: number;
  account_id: string | null;
  description: string | null;
  money_transaction_id: string | null;
  created_at: string;
  updated_at: string;
}

export function useOrderExpenses(orderId?: string) {
  return useQuery({
    queryKey: ["dailygear", "dg_order_expenses", orderId],
    enabled: Boolean(orderId),
    queryFn: async () => {
      if (!orderId) return [] as OrderExpense[];
      const { data, error } = await supabase
        .from("dg_order_expenses")
        .select("*")
        .eq("order_id", orderId)
        .order("cost_type");
      if (error) throw error;
      return (data ?? []) as OrderExpense[];
    },
  });
}

export interface OrderFulfilmentInput {
  orderId: string;
  purchaseCost: number;
  deliveryCost: number;
  otherCost: number;
  accountId: string | null;
  otherDescription: string | null;
  nextStatus: Order["status"] | null;
}

export function useRecordOrderFulfilment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: OrderFulfilmentInput) => {
      const { data, error } = await supabase.rpc("dg_record_order_fulfilment", {
        p_order_id: input.orderId,
        p_purchase_cost: input.purchaseCost,
        p_delivery_cost: input.deliveryCost,
        p_other_cost: input.otherCost,
        p_account_id: input.accountId ?? undefined,
        p_other_description: input.otherDescription ?? undefined,
        p_next_status: input.nextStatus ?? undefined,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dailygear"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["accounts"] });
      qc.invalidateQueries({ queryKey: ["account_balances"] });
      toast.success("Fulfilment costs recorded");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

function orderNumber() {
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `DG-${stamp}-${Math.floor(Math.random() * 9000 + 1000)}`;
}

/**
 * Creates or updates an order together with its line items, timeline entry
 * and stock movements. Keeping this in one mutation guarantees the order,
 * its items and inventory never drift apart.
 */
export function useSaveOrderWithItems() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (draft: DraftOrder) => {
      const user_id = await requireUserId();
      const subtotal = draft.items.reduce((s, i) => s + i.unit_price * i.quantity, 0);
      const total = subtotal + draft.shipping_fee + draft.tax - draft.discount;

      const payload = {
        user_id,
        customer_id: draft.customer_id,
        channel: draft.channel,
        status: draft.status,
        payment_status: draft.payment_status,
        payment_method: draft.payment_method,
        shipping_method: draft.shipping_method,
        shipping_fee: draft.shipping_fee,
        discount: draft.discount,
        tax: draft.tax,
        shipping_address: draft.shipping_address,
        shipping_country: draft.shipping_country ?? null,
        shipping_county: draft.shipping_county ?? null,
        shipping_town: draft.shipping_town ?? null,
        shipping_address_details: draft.shipping_address_details ?? null,
        shipping_zone: draft.shipping_zone ?? null,
        notes: draft.notes,
        subtotal,
        total,
      };

      let orderId = draft.id ?? "";
      let createdOrderNumber = "";

      if (draft.id) {
        const { error } = await supabase.from("dg_orders").update(payload).eq("id", draft.id);
        if (error) throw error;
        await supabase.from("dg_order_items").delete().eq("order_id", draft.id);
      } else {
        const { data, error } = await supabase
          .from("dg_orders")
          .insert({ ...payload, order_number: orderNumber() })
          .select("id, order_number")
          .single();
        if (error) throw error;
        orderId = data.id;
        createdOrderNumber = data.order_number;
        await supabase.from("dg_order_events").insert({
          user_id,
          order_id: orderId,
          type: "created",
          title: "Order created",
        });
      }

      if (draft.items.length) {
        const { error } = await supabase.from("dg_order_items").insert(
          draft.items.map((i) => ({
            user_id,
            order_id: orderId,
            product_id: i.product_id,
            variant_id: i.variant_id,
            name: i.name,
            sku: i.sku,
            quantity: i.quantity,
            unit_price: i.unit_price,
            unit_cost: i.unit_cost,
            total: i.unit_price * i.quantity,
          })),
        );
        if (error) throw error;
      }

      if (!draft.id) {
        const sales = draft.items.filter((i) => i.product_id);
        if (sales.length) {
          for (const item of sales) {
            const { data: reserved, error: reserveError } = item.variant_id
              ? await supabase.rpc("dg_reserve_variant_stock", {
                  p_product_id: item.product_id!,
                  p_variant_id: item.variant_id,
                  p_qty: item.quantity,
                })
              : await supabase.rpc("dg_reserve_stock", {
                  p_product_id: item.product_id!,
                  p_qty: item.quantity,
                });
            if (reserveError || reserved !== true) {
              throw new Error(`Insufficient stock for ${item.name}`);
            }
          }

          const { error } = await supabase.from("dg_stock_movements").insert(
            sales.map((i) => ({
              user_id,
              product_id: i.product_id,
              variant_id: i.variant_id,
              type: "sale" as const,
              quantity: -i.quantity,
              unit_cost: i.unit_cost,
              reference: orderId,
            })),
          );
          if (error) throw error;
        }
      }

      return { orderId, orderNumber: createdOrderNumber };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dailygear"] });
      toast.success("Order saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export interface ConfirmOrderPaymentInput {
  orderId: string;
  accountId: string;
  amount: number;
  transactionId: string;
  paidAt?: string;
  notes?: string | null;
}

export interface ConfirmOrderPaymentResult {
  payment_id: string;
  money_transaction_id: string;
  order_number: string;
  amount_paid: number;
  order_total: number;
  payment_status: Order["payment_status"];
  receipt_number: string;
  account_name: string;
}

/**
 * Records one customer receipt against an order and the selected account.
 * The database RPC owns idempotency, payment-state transitions, and the
 * linked Money Center income transaction so the UI cannot double-post cash.
 */
export function useConfirmOrderPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ConfirmOrderPaymentInput) => {
      const { data, error } = await supabase.rpc(
        "dg_confirm_order_payment" as never,
        {
          p_order_id: input.orderId,
          p_account_id: input.accountId,
          p_amount: input.amount,
          p_transaction_id: input.transactionId.trim(),
          p_paid_at: input.paidAt ?? new Date().toISOString(),
          p_notes: input.notes ?? null,
        } as never,
      );
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      if (!row) throw new Error("Payment confirmation returned no result.");
      return row as unknown as ConfirmOrderPaymentResult;
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["dailygear"] });
      qc.invalidateQueries({ queryKey: ["account_balances"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      toast.success(
        `Payment posted · ${formatMoney(result.amount_paid)} into ${result.account_name} · ${result.receipt_number}`,
      );
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
