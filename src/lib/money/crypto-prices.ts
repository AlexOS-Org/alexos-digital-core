import { useQuery } from "@tanstack/react-query";

export const CRYPTO_SYMBOLS = ["BTC", "ETH", "BNB", "SOL", "XRP", "USDT", "USDC"] as const;
export type CryptoSymbol = (typeof CRYPTO_SYMBOLS)[number];

export type LiveCryptoPrices = {
  updatedAt: string;
  usdtKes: number;
  pricesKes: Partial<Record<CryptoSymbol, number>>;
  pricesUsdt: Partial<Record<CryptoSymbol, number>>;
  source: "binance_public";
  ok?: boolean;
  error?: string;
};

export async function loadLiveCryptoPrices(): Promise<LiveCryptoPrices> {
  const res = await fetch("/api/crypto/prices", { credentials: "same-origin" });
  const body = (await res.json()) as LiveCryptoPrices;
  if (!res.ok || body.ok === false) {
    throw new Error(body.error || "Live prices unavailable");
  }
  return body;
}

/** Poll public Binance prices every 60s while the Accounts page is open. */
export function useLiveCryptoPrices(enabled = true) {
  return useQuery({
    queryKey: ["money", "crypto_live_prices"],
    queryFn: loadLiveCryptoPrices,
    enabled,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export function liveKesPrice(
  prices: LiveCryptoPrices | undefined,
  symbol: string,
): number | null {
  if (!prices?.pricesKes) return null;
  const n = prices.pricesKes[symbol as CryptoSymbol];
  return typeof n === "number" && Number.isFinite(n) ? n : null;
}
