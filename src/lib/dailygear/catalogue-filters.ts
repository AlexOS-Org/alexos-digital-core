import type { ProductStatus } from "./types";

export type CatalogueFilterKey =
  | "all"
  | "draft"
  | "published"
  | "catalogue_ready"
  | "sales_ready"
  | "not_ready"
  | "zero_price"
  | "premium"
  | "low_stock"
  | "out_of_stock"
  | "funnel_connected"
  | "funnel_missing";

export interface CatalogueFilterOption {
  value: CatalogueFilterKey;
  label: string;
}

export const CATALOGUE_FILTER_OPTIONS: CatalogueFilterOption[] = [
  { value: "all", label: "All products" },
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "catalogue_ready", label: "Catalogue ready" },
  { value: "sales_ready", label: "Sales ready" },
  { value: "not_ready", label: "Not ready" },
  { value: "zero_price", label: "Zero price" },
  { value: "premium", label: "Premium" },
  { value: "low_stock", label: "Low stock" },
  { value: "out_of_stock", label: "Out of stock" },
  { value: "funnel_connected", label: "Funnel connected" },
  { value: "funnel_missing", label: "Funnel missing" },
];

export interface CatalogueFilterContext {
  status: ProductStatus | null;
  price: number;
  stock: number;
  lowStock: boolean;
  premium: boolean;
  hasFunnel: boolean;
  catalogueReady: boolean;
  salesReady: boolean;
  missingPrice: boolean;
}

const PUBLISHED_STATUSES: ProductStatus[] = ["active"];

export function matchesCatalogueFilter(
  product: CatalogueFilterContext,
  filter: CatalogueFilterKey,
): boolean {
  switch (filter) {
    case "all":
      return true;
    case "draft":
      return product.status === "draft";
    case "published":
      return product.status !== null && PUBLISHED_STATUSES.includes(product.status);
    case "catalogue_ready":
      return product.catalogueReady;
    case "sales_ready":
      return product.salesReady;
    case "not_ready":
      return !product.salesReady || !product.catalogueReady;
    case "zero_price":
      return product.missingPrice || !(Number.isFinite(product.price) && product.price > 0);
    case "premium":
      return product.premium;
    case "low_stock":
      return product.lowStock;
    case "out_of_stock":
      return product.stock <= 0;
    case "funnel_connected":
      return product.hasFunnel;
    case "funnel_missing":
      return !product.hasFunnel;
  }
}
