import { useEffect, useMemo, useState } from "react";
import type { DraftOrderItem } from "./api";

const CART_STORAGE_KEY = "dailygear-order-cart";

export interface OrderCartItem extends DraftOrderItem {
  id: string;
}

function createNewItem(): OrderCartItem {
  const id =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Math.random().toString(36).slice(2)}-${Date.now()}`;
  return {
    id,
    product_id: null,
    variant_id: null,
    name: "",
    sku: null,
    quantity: 1,
    unit_price: 0,
    unit_cost: 0,
  };
}

export function useOrderCart() {
  const [items, setItems] = useState<OrderCartItem[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as OrderCartItem[];
        setItems(parsed.map((item) => ({ ...item, quantity: Number(item.quantity) || 1 })));
      } else {
        setItems([]);
      }
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0),
    [items],
  );

  const addItem = (item: Partial<OrderCartItem>) => {
    setItems((current) => {
      const existing = item.product_id
        ? current.find((x) => x.product_id === item.product_id && x.variant_id === item.variant_id)
        : null;
      if (existing) {
        return current.map((x) =>
          x.id === existing.id
            ? {
                ...x,
                quantity: x.quantity + (item.quantity ?? 1),
                unit_price: item.unit_price ?? x.unit_price,
                unit_cost: item.unit_cost ?? x.unit_cost,
              }
            : x,
        );
      }
      return [...current, { ...createNewItem(), ...item, quantity: item.quantity ?? 1 }];
    });
  };

  const updateItem = (id: string, updates: Partial<OrderCartItem>) => {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  const removeItem = (id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  };

  const clear = () => setItems([]);

  const addBlankItem = () => setItems((current) => [...current, createNewItem()]);

  return {
    items,
    total,
    addItem,
    addBlankItem,
    updateItem,
    removeItem,
    clear,
  };
}
