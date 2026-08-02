import type { OrderStatus, PaymentStatus, ProductStatus, StockMovementType } from "./types";

export const DG_CURRENCY = "KES";

/** Badge presentation is data, not markup — keeps status handling in one place. */
export interface StatusMeta {
  label: string;
  className: string;
}

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  "new",
  "processing",
  "packed",
  "shipped",
  "delivered",
];

export const ORDER_STATUS_META: Record<OrderStatus, StatusMeta> = {
  new: { label: "New", className: "bg-primary/10 text-primary border-primary/20" },
  processing: { label: "Processing", className: "bg-chart-4/10 text-chart-4 border-chart-4/20" },
  packed: { label: "Packed", className: "bg-accent text-accent-foreground border-border" },
  shipped: { label: "Shipped", className: "bg-chart-2/10 text-chart-2 border-chart-2/20" },
  delivered: { label: "Delivered", className: "bg-success/10 text-success border-success/20" },
  cancelled: {
    label: "Cancelled",
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
  returned: { label: "Returned", className: "bg-muted text-muted-foreground border-border" },
};

export const PAYMENT_STATUS_META: Record<PaymentStatus, StatusMeta> = {
  unpaid: {
    label: "Unpaid",
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
  partial: { label: "Partial", className: "bg-chart-4/10 text-chart-4 border-chart-4/20" },
  paid: { label: "Paid", className: "bg-success/10 text-success border-success/20" },
  refunded: { label: "Refunded", className: "bg-muted text-muted-foreground border-border" },
};

export const PRODUCT_STATUS_META: Record<ProductStatus, StatusMeta> = {
  draft: { label: "Draft", className: "bg-muted text-muted-foreground border-border" },
  active: { label: "Active", className: "bg-success/10 text-success border-success/20" },
  archived: { label: "Archived", className: "bg-muted text-muted-foreground border-border" },
  out_of_stock: {
    label: "Out of stock",
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
};

export const STOCK_MOVEMENT_LABELS: Record<StockMovementType, string> = {
  purchase: "Purchase",
  sale: "Sale",
  adjustment: "Adjustment",
  transfer_in: "Transfer in",
  transfer_out: "Transfer out",
  return: "Return",
  damage: "Damage",
};

export const SALES_CHANNELS = [
  "direct",
  "whatsapp",
  "instagram",
  "facebook",
  "tiktok",
  "marketplace",
  "walk_in",
] as const;

export const DEAD_STOCK_DAYS = 60;
export const DEFAULT_PAGE_SIZE = 20;
