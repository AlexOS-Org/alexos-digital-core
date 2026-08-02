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

/** Order status change + timeline entry, kept out of the components. */
export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ order, status }: { order: Order; status: Order["status"] }) => {
      const patch: Record<string, unknown> = { status };
      if (status === "delivered") patch.delivered_at = new Date().toISOString();
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
