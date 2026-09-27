import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bitcoin, CircleAlert, Plus, RefreshCw, Trash2, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlexOSEmptyState } from "@/components/alexos/states";
import { formatMoney } from "@/lib/money/format";
import {
  BINANCE_WITHDRAWAL_MINIMUM_KES,
  liveKesPrice,
  useLiveCryptoPrices,
} from "@/lib/money/crypto-prices";
import { cn } from "@/lib/utils";
import type { AlexOSTone } from "@/lib/ui/status";

const COINS = ["BTC", "ETH", "BNB", "SOL", "XRP", "USDT", "USDC"] as const;
type Coin = (typeof COINS)[number];
type Holding = {
  id: string;
  exchange: string;
  symbol: Coin;
  quantity: number;
  price_kes: number;
  valued_at: string;
  notes: string | null;
};

/** Coin identity is a category, not a status, so it reuses the semantic tone
 *  scale instead of an arbitrary palette colour per asset. */
const COIN_TONES: Record<Coin, AlexOSTone> = {
  BTC: "warning",
  ETH: "debt",
  BNB: "warning",
  SOL: "info",
  XRP: "neutral",
  USDT: "income",
  USDC: "info",
};

export function CryptoHoldingsPanel() {
  const qc = useQueryClient();
  const [symbol, setSymbol] = useState<Coin>("BTC");
  const [quantity, setQuantity] = useState("");
  const [priceKes, setPriceKes] = useState("");
  const [notes, setNotes] = useState("");
  const live = useLiveCryptoPrices(true);

  const holdings = useQuery({
    queryKey: ["money", "crypto_holdings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("money_crypto_holdings" as never)
        .select("id,exchange,symbol,quantity,price_kes,valued_at,notes")
        .order("symbol", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as Holding[];
    },
  });

  const liveForForm = liveKesPrice(live.data, symbol);
  const effectivePriceInput =
    priceKes !== "" ? priceKes : liveForForm != null ? String(Math.round(liveForForm)) : "";

  const save = useMutation({
    mutationFn: async () => {
      const q = Number(quantity);
      const price = Number(effectivePriceInput);
      if (!Number.isFinite(q) || q <= 0) throw new Error("Enter a valid coin quantity.");
      if (!Number.isFinite(price) || price < 0) throw new Error("Enter a valid KES price.");
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("You must be signed in.");
      const { error } = await supabase.from("money_crypto_holdings" as never).insert({
        user_id: userData.user.id,
        exchange: "Binance",
        symbol,
        quantity: q,
        price_kes: price,
        valued_at: new Date().toISOString(),
        notes: notes.trim() || null,
      } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["money", "crypto_holdings"] });
      setQuantity("");
      setPriceKes("");
      setNotes("");
      toast.success("Crypto holding added");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("money_crypto_holdings" as never)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["money", "crypto_holdings"] });
      toast.success("Crypto holding removed");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const applyLivePrices = useMutation({
    mutationFn: async () => {
      if (!live.data) throw new Error("Live prices not loaded yet.");
      const rows = holdings.data ?? [];
      if (rows.length === 0) throw new Error("No holdings to update.");
      const now = new Date().toISOString();
      for (const h of rows) {
        const price = liveKesPrice(live.data, h.symbol);
        if (price == null) continue;
        const { error } = await supabase
          .from("money_crypto_holdings" as never)
          .update({ price_kes: price, valued_at: now } as never)
          .eq("id", h.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["money", "crypto_holdings"] });
      toast.success("Holdings revalued at live Binance prices");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateQuantity = useMutation({
    mutationFn: async ({ id, quantity: q }: { id: string; quantity: number }) => {
      if (!Number.isFinite(q) || q <= 0) throw new Error("Invalid quantity");
      const holding = holdings.data?.find((h) => h.id === id);
      const price = liveKesPrice(live.data, holding?.symbol ?? "");
      const payload: Record<string, unknown> = { quantity: q };
      if (price != null) {
        payload.price_kes = price;
        payload.valued_at = new Date().toISOString();
      }
      const { error } = await supabase
        .from("money_crypto_holdings" as never)
        .update(payload as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["money", "crypto_holdings"] });
      toast.success("Quantity updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const storedTotal = useMemo(
    () =>
      (holdings.data ?? []).reduce((sum, holding) => sum + holding.quantity * holding.price_kes, 0),
    [holdings.data],
  );

  const liveTotal = useMemo(() => {
    if (!live.data) return null;
    return (holdings.data ?? []).reduce((sum, h) => {
      const p = liveKesPrice(live.data, h.symbol) ?? h.price_kes;
      return sum + h.quantity * p;
    }, 0);
  }, [holdings.data, live.data]);

  return (
    <Card data-tone="warning">
      <CardHeader className="space-y-2">
        <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-base">
          <span className="flex items-center gap-2">
            <span className="alexos-tone-bg alexos-tone-text grid size-9 place-items-center rounded-full">
              <Bitcoin aria-hidden="true" className="size-4" />
            </span>
            Binance crypto holdings
          </span>
          <span className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={live.isFetching}
              onClick={() => void live.refetch()}
            >
              <RefreshCw
                aria-hidden="true"
                className={cn("mr-1.5 size-3.5", live.isFetching && "animate-spin")}
              />
              Refresh prices
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={
                applyLivePrices.isPending || !live.data || (holdings.data ?? []).length === 0
              }
              onClick={() => applyLivePrices.mutate()}
            >
              <TrendingUp aria-hidden="true" className="mr-1.5 size-3.5" />
              {applyLivePrices.isPending ? "Updating…" : "Apply live prices"}
            </Button>
          </span>
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Live prices from Binance public market data (no API keys). Use{" "}
          <strong>Apply live prices</strong> when the market moves to update stored KES values.
          Quantity is what you hold — edit it after buys/sells. Does not log into Binance.
        </p>
        {live.data && (
          <p className="text-[11px] text-muted-foreground">
            USDT/KES ≈ {live.data.usdtKes.toFixed(2)} · updated{" "}
            {new Date(live.data.updatedAt).toLocaleTimeString()}
            {liveForForm != null && (
              <>
                {" · "}
                {symbol} live {formatMoney(liveForForm, "KES")}
              </>
            )}
          </p>
        )}
        {live.isError && (
          <p data-tone="danger" className="alexos-tone-text text-xs">
            Live prices unavailable — enter KES manually.
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="crypto-symbol">Coin</Label>
            <Select
              value={symbol}
              onValueChange={(value) => {
                setSymbol(value as Coin);
                setPriceKes("");
              }}
            >
              <SelectTrigger id="crypto-symbol">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COINS.map((coin) => {
                  const p = liveKesPrice(live.data, coin);
                  return (
                    <SelectItem key={coin} value={coin}>
                      {coin}
                      {p != null ? ` · ${formatMoney(p, "KES")}` : ""}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="crypto-quantity">Quantity</Label>
            <Input
              id="crypto-quantity"
              inputMode="decimal"
              type="number"
              min="0"
              step="any"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="crypto-price">Price per coin (KES)</Label>
            <Input
              id="crypto-price"
              inputMode="decimal"
              type="number"
              min="0"
              step="0.01"
              value={effectivePriceInput}
              onChange={(e) => setPriceKes(e.target.value)}
              placeholder={liveForForm != null ? String(Math.round(liveForForm)) : "0"}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="crypto-note">Note</Label>
            <Input
              id="crypto-note"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional"
            />
          </div>
        </div>
        <Button type="button" size="sm" onClick={() => save.mutate()} disabled={save.isPending}>
          <Plus aria-hidden="true" className="mr-1.5 size-3.5" />
          {save.isPending ? "Adding…" : "Add holding"}
        </Button>

        <div className="grid gap-2 sm:grid-cols-2">
          <div className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2 text-sm">
            <span className="text-muted-foreground">Stored value</span>
            <strong className="tabular-nums">{formatMoney(storedTotal, "KES")}</strong>
          </div>
          <div
            data-tone="warning"
            className="alexos-tone-bg flex items-center justify-between rounded-xl px-3 py-2 text-sm"
          >
            <span className="text-muted-foreground">Live value</span>
            <strong className="alexos-tone-text tabular-nums">
              {liveTotal != null ? formatMoney(liveTotal, "KES") : "—"}
            </strong>
          </div>
        </div>

        <div className="space-y-2">
          {(holdings.data ?? []).map((holding) => {
            const storedValue = holding.quantity * holding.price_kes;
            const livePrice = liveKesPrice(live.data, holding.symbol);
            const liveValue = livePrice != null ? holding.quantity * livePrice : storedValue;
            const delta = liveValue - storedValue;
            const low = liveValue <= BINANCE_WITHDRAWAL_MINIMUM_KES;
            const tone: AlexOSTone = low ? "danger" : COIN_TONES[holding.symbol];
            return (
              <div
                key={holding.id}
                data-tone={tone}
                className={cn(
                  "flex flex-wrap items-center justify-between gap-3 rounded-xl border px-3 py-2.5",
                  low && "alexos-tone-bg alexos-tone-border",
                )}
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span
                    data-tone={tone}
                    className="alexos-tone-bg alexos-tone-text grid size-8 shrink-0 place-items-center rounded-full text-[10px] font-bold"
                  >
                    {holding.symbol}
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium">
                      {holding.exchange} · {holding.symbol}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {holding.quantity} coins
                      {livePrice != null
                        ? ` · live ${formatMoney(livePrice, "KES")} / coin`
                        : ` · stored ${formatMoney(holding.price_kes, "KES")}`}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-right">
                    <strong className={cn("tabular-nums", low && "alexos-tone-text")}>
                      {formatMoney(liveValue, "KES")}
                    </strong>
                    {livePrice != null && Math.abs(delta) >= 1 && (
                      <div
                        data-tone={delta >= 0 ? "income" : "expense"}
                        className="alexos-tone-text text-[11px] tabular-nums"
                      >
                        {delta >= 0 ? "+" : ""}
                        {formatMoney(delta, "KES")} vs stored
                      </div>
                    )}
                  </div>
                  {low && (
                    <span
                      data-tone="danger"
                      className="alexos-tone-text"
                      role="img"
                      aria-label={`At or below KES ${BINANCE_WITHDRAWAL_MINIMUM_KES.toLocaleString()}`}
                    >
                      <CircleAlert aria-hidden="true" className="size-4" />
                    </span>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    disabled={updateQuantity.isPending}
                    onClick={() => {
                      const next = window.prompt(
                        `New ${holding.symbol} quantity (current ${holding.quantity})`,
                        String(holding.quantity),
                      );
                      if (next == null) return;
                      const q = Number(next);
                      if (!Number.isFinite(q) || q <= 0) {
                        toast.error("Invalid quantity");
                        return;
                      }
                      updateQuantity.mutate({ id: holding.id, quantity: q });
                    }}
                  >
                    Edit qty
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => remove.mutate(holding.id)}
                    disabled={remove.isPending}
                    aria-label={`Remove ${holding.symbol} holding`}
                  >
                    <Trash2 aria-hidden="true" className="size-4 text-destructive" />
                  </Button>
                </div>
              </div>
            );
          })}
          {holdings.isLoading ? (
            <div className="space-y-2" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
          ) : (
            (holdings.data ?? []).length === 0 && (
              <AlexOSEmptyState
                icon={Bitcoin}
                title="No crypto holdings recorded"
                description="Add your coin quantities — prices fill from Binance public market data."
                compact
              />
            )
          )}
        </div>
      </CardContent>
    </Card>
  );
}
