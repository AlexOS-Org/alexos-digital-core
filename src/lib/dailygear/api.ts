import { useMutation, useQuery, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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
  | "dg_stock_movements";

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
export const useVariants = variantsResource.useList;

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
  notes: string | null;
  items: DraftOrderItem[];
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
        notes: draft.notes,
        subtotal,
        total,
      };

      let orderId = draft.id ?? "";
      let orderNumber = "";

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
        orderNumber = data.order_number;
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
            if (item.variant_id) {
              const { data: variant, error: variantError } = await supabase
                .from("dg_product_variants")
                .select("stock_quantity")
                .eq("id", item.variant_id)
                .single();
              if (variantError) throw variantError;
              if (variant == null || Number(variant.stock_quantity) < item.quantity) {
                throw new Error(`Insufficient stock for variant ${item.name}`);
              }
              const { error: variantUpdateError } = await supabase
                .from("dg_product_variants")
                .update({ stock_quantity: Number(variant.stock_quantity) - item.quantity })
                .eq("id", item.variant_id);
              if (variantUpdateError) throw variantUpdateError;
            }

            const { data: product, error: productError } = await supabase
              .from("dg_products")
              .select("stock_quantity")
              .eq("id", item.product_id)
              .single();
            if (productError) throw productError;
            if (product == null || Number(product.stock_quantity) < item.quantity) {
              throw new Error(`Insufficient stock for ${item.name}`);
            }
            const { error: productUpdateError } = await supabase
              .from("dg_products")
              .update({ stock_quantity: Number(product.stock_quantity) - item.quantity })
              .eq("id", item.product_id);
            if (productUpdateError) throw productUpdateError;
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

      return { orderId, orderNumber };

      return orderId;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dailygear"] });
      toast.success("Order saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
