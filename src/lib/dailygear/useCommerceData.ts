import { useMemo } from "react";
import {
  useCustomers,
  useOrderItems,
  useOrders,
  useProducts,
  useStockMovements,
} from "./api";
import { DG_CURRENCY } from "./constants";
import type { IntelligenceContext } from "./types";

/**
 * One composed read for every DailyGear surface.
 *
 * Pages consume this hook and never call Supabase directly, so swapping the
 * persistence layer or adding caching happens in exactly one place.
 */
export function useCommerceData() {
  const products = useProducts();
  const orders = useOrders();
  const orderItems = useOrderItems();
  const customers = useCustomers();
  const movements = useStockMovements();

  const isLoading =
    products.isLoading ||
    orders.isLoading ||
    orderItems.isLoading ||
    customers.isLoading;

  const error =
    products.error ?? orders.error ?? orderItems.error ?? customers.error ?? null;

  const context = useMemo<IntelligenceContext>(
    () => ({
      products: products.data ?? [],
      orders: orders.data ?? [],
      orderItems: orderItems.data ?? [],
      customers: customers.data ?? [],
      currency: DG_CURRENCY,
    }),
    [products.data, orders.data, orderItems.data, customers.data],
  );

  return {
    ...context,
    movements: movements.data ?? [],
    context,
    isLoading,
    error: error as Error | null,
    isEmpty:
      !isLoading &&
      context.products.length === 0 &&
      context.orders.length === 0 &&
      context.customers.length === 0,
  };
}
