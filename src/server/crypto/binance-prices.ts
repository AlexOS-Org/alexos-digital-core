/** Public market data only — no Binance API keys / account access. */

export const CRYPTO_SYMBOLS = ["BTC", "ETH", "BNB", "SOL", "XRP", "USDT", "USDC"] as const;
export type CryptoSymbol = (typeof CRYPTO_SYMBOLS)[number];

const BINANCE_SYMBOL: Record<CryptoSymbol, string | null> = {
  BTC: "BTCUSDT",
  ETH: "ETHUSDT",
  BNB: "BNBUSDT",
  SOL: "SOLUSDT",
  XRP: "XRPUSDT",
  USDT: null,
  USDC: "USDCUSDT",
};

export type LiveCryptoPrices = {
  updatedAt: string;
  usdtKes: number;
  pricesKes: Partial<Record<CryptoSymbol, number>>;
  pricesUsdt: Partial<Record<CryptoSymbol, number>>;
  source: "binance_public";
};

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Price fetch failed (${res.status}): ${body.slice(0, 120)}`);
  }
  return res.json() as Promise<T>;
}

async function resolveUsdtKes(): Promise<number> {
  try {
    const row = await fetchJson<{ price: string }>(
      "https://api.binance.com/api/v3/ticker/price?symbol=USDTKES",
    );
    const n = Number(row.price);
    if (Number.isFinite(n) && n > 0) return n;
  } catch {
    /* fall through */
  }
  try {
    const fx = await fetchJson<{ rates?: { KES?: number } }>(
      "https://open.er-api.com/v6/latest/USD",
    );
    const n = Number(fx.rates?.KES);
    if (Number.isFinite(n) && n > 0) return n;
  } catch {
    /* fall through */
  }
  return 129;
}

export async function fetchLiveCryptoPrices(): Promise<LiveCryptoPrices> {
  const usdtKes = await resolveUsdtKes();
  const pricesUsdt: Partial<Record<CryptoSymbol, number>> = { USDT: 1 };
  const pricesKes: Partial<Record<CryptoSymbol, number>> = { USDT: usdtKes };

  await Promise.all(
    CRYPTO_SYMBOLS.filter((s) => s !== "USDT").map(async (symbol) => {
      const pair = BINANCE_SYMBOL[symbol];
      if (!pair) return;
      try {
        const row = await fetchJson<{ price: string }>(
          `https://api.binance.com/api/v3/ticker/price?symbol=${pair}`,
        );
        const usdt = Number(row.price);
        if (!Number.isFinite(usdt) || usdt <= 0) return;
        pricesUsdt[symbol] = usdt;
        pricesKes[symbol] = usdt * usdtKes;
      } catch {
        /* skip coin on failure */
      }
    }),
  );

  return {
    updatedAt: new Date().toISOString(),
    usdtKes,
    pricesKes,
    pricesUsdt,
    source: "binance_public",
  };
}
