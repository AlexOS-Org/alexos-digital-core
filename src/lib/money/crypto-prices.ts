import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const CRYPTO_SYMBOLS = ["BTC", "ETH", "BNB", "SOL", "XRP", "USDT", "USDC"] as const;
export type CryptoSymbol = (typeof CRYPTO_SYMBOLS)[number];

export type LiveCryptoPrices = {
  updatedAt: string;
  usdtKes: number;
  pricesKes: Partial<Record<CryptoSymbol, number>>;
  pricesUsdt: Partial<Record<CryptoSymbol, number>>;
  source: "binance_public";
};

export const BINANCE_WITHDRAWAL_MINIMUM_KES = 1500;

type CryptoHolding = {
  symbol: CryptoSymbol;
  quantity: number;
  price_kes: number;
};

type CryptoPricesResponse = LiveCryptoPrices & { ok: boolean; error?: string };

async function loadLiveCryptoPrices(): Promise<LiveCryptoPrices> {
  const res = await fetch("/api/crypto/prices", {
    headers: { Accept: "application/json" },
  });
  const data = (await res.json()) as CryptoPricesResponse;
  if (!res.ok || !data.ok) {
    throw new Error(data.error || `Price fetch failed (${res.status})`);
  }
  return data;
}

export function useLiveCryptoPrices(enabled = true) {
  return useQuery({
    queryKey: ["money", "crypto_live_prices"],
    queryFn: loadLiveCryptoPrices,
    enabled,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export function liveKesPrice(prices: LiveCryptoPrices | undefined, symbol: string): number | null {
  if (!prices?.pricesKes) return null;
  const n = prices.pricesKes[symbol as CryptoSymbol];
  return typeof n === "number" && Number.isFinite(n) ? n : null;
}

export function useLiveBinanceBalance() {
  const prices = useLiveCryptoPrices(true);
  const holdings = useQuery({
    queryKey: ["money", "crypto_holdings", "binance_balance"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("money_crypto_holdings" as never)
        .select("symbol,quantity,price_kes")
        .eq("exchange", "Binance");
      if (error) throw error;
      return (data ?? []) as unknown as CryptoHolding[];
    },
  });

  const balance = (holdings.data ?? []).reduce((sum, holding) => {
    const price = liveKesPrice(prices.data, holding.symbol) ?? Number(holding.price_kes);
    return sum + Number(holding.quantity) * price;
  }, 0);

  return {
    balance: prices.isError || holdings.isError ? null : balance,
    isLoading: prices.isLoading || holdings.isLoading,
    isError: prices.isError || holdings.isError,
  };
}
