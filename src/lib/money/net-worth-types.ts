import type { Database } from "@/integrations/supabase/types";

export type Asset = Database["public"]["Tables"]["assets"]["Row"];
export type CryptoHolding = Database["public"]["Tables"]["money_crypto_holdings"]["Row"];
