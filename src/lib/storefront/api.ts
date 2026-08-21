import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

/**
 * Public storefront reads.
 *
 * Everything here runs with the anon/publishable key against the
 * "published storefront" RLS policies — no session required. Admin data
 * (orders, customers, costs) is never reachable from this module.
 */
export type Storefront = Tables<"dg_storefronts">;
export type StoreProduct = Tables<"dg_products">;
export type StoreVariant = Tables<"dg_product_variants">;
export type StoreCategory = Tables<"dg_categories">;
export type StoreBrand = Tables<"dg_brands">;

/** Fields safe to expose publicly — cost price and internals stay server-side. */
const PRODUCT_COLUMNS =
  "id,user_id,name,slug,description,short_description,seo_title,seo_description,seo_keywords,image_alt_text,price,sale_price,currency,images,tags,sku,stock_quantity,status,category_id,brand_id,attributes,availability_confirmed,created_at";

export const STORE_KEY = ["storefront"] as const;

export type StorefrontSettings = Pick<
  Storefront,
  | "slug"
  | "name"
  | "tagline"
  | "support_email"
  | "support_phone"
  | "whatsapp"
  | "currency"
  | "free_shipping_threshold"
  | "flat_shipping_fee"
  | "published"
>;

/** Loads the owner’s storefront, including an unpublished draft used by Settings. */
export function useAdminStorefront() {
  return useQuery({
    queryKey: [...STORE_KEY, "admin"],
    queryFn: async () => {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) return null;

      const { data, error } = await supabase
        .from("dg_storefronts")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as Storefront | null;
    },
  });
}

/** Upserts the one canonical DailyGear storefront row for the authenticated owner. */
export function useSaveAdminStorefront() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (settings: StorefrontSettings) => {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error("You must be signed in to manage the DailyGear storefront.");

      const { data, error } = await supabase
        .from("dg_storefronts")
        .upsert({ user_id: user.id, ...settings }, { onConflict: "user_id" })
        .select("*")
        .single();
      if (error) throw error;
      return data as Storefront;
    },
    onSuccess: (storefront) => {
      queryClient.setQueryData([...STORE_KEY, "admin"], storefront);
      queryClient.invalidateQueries({ queryKey: [...STORE_KEY, "store"] });
      queryClient.invalidateQueries({ queryKey: [...STORE_KEY, "categories"] });
      queryClient.invalidateQueries({ queryKey: [...STORE_KEY, "products"] });
    },
  });
}

/** Resolves the active storefront. With no slug, the first published store wins. */
export function useStorefront(slug?: string) {
  return useQuery({
    queryKey: [...STORE_KEY, "store", slug ?? "default"],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      let q = supabase.from("dg_storefronts").select("*").eq("published", true);
      if (slug) q = q.eq("slug", slug);
      const { data, error } = await q.order("created_at", { ascending: true }).limit(1);
      if (error) throw error;
      return (data?.[0] ?? null) as Storefront | null;
    },
  });
}

export interface ProductFilters {
  search?: string;
  categoryId?: string | null;
  categoryIds?: string[];
  brandId?: string | null;
  sort?: "newest" | "price-asc" | "price-desc" | "name";
  limit?: number;
}

export function useStoreProducts(userId: string | undefined, filters: ProductFilters = {}) {
  return useQuery({
    queryKey: [...STORE_KEY, "products", userId, filters],
    enabled: Boolean(userId),
    staleTime: 60_000,
    queryFn: async () => {
      let q = supabase
        .from("dg_products")
        .select(PRODUCT_COLUMNS)
        .eq("user_id", userId!)
        .eq("status", "active")
        .is("deleted_at", null);

      if (filters.search) q = q.ilike("name", `%${filters.search}%`);
      if (filters.categoryIds?.length) q = q.in("category_id", filters.categoryIds);
      else if (filters.categoryId) q = q.eq("category_id", filters.categoryId);
      if (filters.brandId) q = q.eq("brand_id", filters.brandId);

      switch (filters.sort) {
        case "price-asc":
          q = q.order("price", { ascending: true });
          break;
        case "price-desc":
          q = q.order("price", { ascending: false });
          break;
        case "name":
          q = q.order("name", { ascending: true });
          break;
        default:
          q = q.order("created_at", { ascending: false });
      }
      if (filters.limit) q = q.limit(filters.limit);

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as StoreProduct[];
    },
  });
}

export function useStoreProduct(id: string | undefined) {
  return useQuery({
    queryKey: [...STORE_KEY, "product", id],
    enabled: Boolean(id),
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dg_products")
        .select(PRODUCT_COLUMNS)
        .eq("id", id!)
        .eq("status", "active")
        .is("deleted_at", null)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as unknown as StoreProduct | null;
    },
  });
}

export function useStoreVariants(productId: string | undefined) {
  return useQuery({
    queryKey: [...STORE_KEY, "variants", productId],
    enabled: Boolean(productId),
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dg_product_variants")
        .select(
          "id,product_id,name,sku,price,sale_price,stock_quantity,image_url,options,color,availability_confirmed,sort_order",
        )
        .eq("product_id", productId!)
        .is("deleted_at", null)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as StoreVariant[];
    },
  });
}

export function useStoreCategories(userId: string | undefined) {
  return useQuery({
    queryKey: [...STORE_KEY, "categories", userId],
    enabled: Boolean(userId),
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dg_categories")
        .select("id,name,slug,description,parent_id,sort_order")
        .eq("user_id", userId!)
        .is("deleted_at", null)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as StoreCategory[];
    },
  });
}

export function useStoreBrands(userId: string | undefined) {
  return useQuery({
    queryKey: [...STORE_KEY, "brands", userId],
    enabled: Boolean(userId),
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dg_brands")
        .select("id,name,logo_url,website")
        .eq("user_id", userId!)
        .is("deleted_at", null)
        .order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as StoreBrand[];
    },
  });
}

/** Effective selling price — sale price wins when present and lower. */
export function effectivePrice(product: Pick<StoreProduct, "price" | "sale_price">) {
  const sale = product.sale_price == null ? null : Number(product.sale_price);
  const base = Number(product.price);
  return sale != null && sale > 0 && sale < base ? sale : base;
}

export function isOnSale(product: Pick<StoreProduct, "price" | "sale_price">) {
  return effectivePrice(product) < Number(product.price);
}

export function productImage(product: Pick<StoreProduct, "images">) {
  const images = (product.images ?? []) as string[];
  return images[0] ?? null;
}

export function productSecondaryImage(product: Pick<StoreProduct, "images">) {
  const images = (product.images ?? []) as string[];
  return images[1] ?? null;
}

export function formatMoney(value: number, currency = "KES") {
  return `${currency} ${Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}
