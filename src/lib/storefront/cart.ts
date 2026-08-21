import { useCallback, useSyncExternalStore } from "react";

/**
 * Guest cart — a tiny localStorage-backed store shared by every storefront
 * route. Deliberately framework-free so the header badge, cart page and
 * checkout all read the same snapshot without prop drilling or context.
 */
export interface CartLine {
  productId: string;
  variantId: string | null;
  name: string;
  sku: string | null;
  price: number;
  image: string | null;
  quantity: number;
  maxQuantity: number;
}

const KEY = "dailygear.cart.v1";
const RECENT_KEY = "dailygear.recent.v1";

let lines: CartLine[] = [];
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(lines));
  } catch {
    /* storage unavailable — cart stays in memory for this session */
  }
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) lines = JSON.parse(raw) as CartLine[];
  } catch {
    lines = [];
  }
}

function subscribe(cb: () => void) {
  hydrate();
  listeners.add(cb);
  return () => listeners.delete(cb);
}

const EMPTY: CartLine[] = [];
const getSnapshot = () => (hydrated ? lines : EMPTY);
const getServerSnapshot = () => EMPTY;

function keyOf(line: Pick<CartLine, "productId" | "variantId">) {
  return `${line.productId}::${line.variantId ?? ""}`;
}

export const cartStore = {
  add(line: Omit<CartLine, "quantity">, quantity = 1) {
    hydrate();
    const existing = lines.find((l) => keyOf(l) === keyOf(line));
    if (existing) {
      existing.quantity = Math.min(existing.quantity + quantity, Math.max(1, line.maxQuantity));
      lines = [...lines];
    } else {
      lines = [...lines, { ...line, quantity: Math.max(1, quantity) }];
    }
    persist();
    emit();
  },
  replace(next: CartLine[]) {
    hydrate();
    lines = next
      .filter((line) => line.productId && line.quantity > 0)
      .map((line) => ({
        ...line,
        quantity: Math.max(1, Math.min(Math.floor(line.quantity), Math.max(1, line.maxQuantity))),
      }));
    persist();
    emit();
  },
  setQuantity(productId: string, variantId: string | null, quantity: number) {
    hydrate();
    lines = lines
      .map((l) =>
        keyOf(l) === keyOf({ productId, variantId })
          ? { ...l, quantity: Math.max(0, Math.min(quantity, Math.max(1, l.maxQuantity))) }
          : l,
      )
      .filter((l) => l.quantity > 0);
    persist();
    emit();
  },
  remove(productId: string, variantId: string | null) {
    hydrate();
    lines = lines.filter((l) => keyOf(l) !== keyOf({ productId, variantId }));
    persist();
    emit();
  },
  clear() {
    hydrate();
    lines = [];
    persist();
    emit();
  },
};

export function useCart() {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const subtotal = items.reduce((s, l) => s + l.price * l.quantity, 0);
  const count = items.reduce((s, l) => s + l.quantity, 0);
  return { items, subtotal, count, ...cartStore };
}

/* ── Recently viewed ──────────────────────────────────────────── */

let recent: string[] = [];
let recentHydrated = false;
const recentListeners = new Set<() => void>();
const EMPTY_RECENT: string[] = [];

function hydrateRecent() {
  if (recentHydrated || typeof window === "undefined") return;
  recentHydrated = true;
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    if (raw) recent = JSON.parse(raw) as string[];
  } catch {
    recent = [];
  }
}

export function useRecentlyViewed() {
  const ids = useSyncExternalStore(
    (cb) => {
      hydrateRecent();
      recentListeners.add(cb);
      return () => recentListeners.delete(cb);
    },
    () => (recentHydrated ? recent : EMPTY_RECENT),
    () => EMPTY_RECENT,
  );

  const track = useCallback((id: string) => {
    hydrateRecent();
    recent = [id, ...recent.filter((r) => r !== id)].slice(0, 8);
    try {
      window.localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
    } catch {
      /* ignore */
    }
    for (const l of recentListeners) l();
  }, []);

  return { ids, track };
}
