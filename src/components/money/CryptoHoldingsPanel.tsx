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
import { formatMoney } from "@/lib/money/format";
import { liveKesPrice, useLiveCryptoPrices } from "@/lib/money/crypto-prices";
import { cn } from "@/lib/utils";

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

function coinStyle(symbol: Coin) {
  const styles: Record<Coin, string> = {
    BTC: "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",
    ETH: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300",
    BNB: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-300",
    SOL: "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
    XRP: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    USDT: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
    USDC: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
  };
  return styles[symbol];
}

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

  // Prefill price field from live ticker when coin changes
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

  /** Write live KES prices onto every holding (mark-to-market). Quantity unchanged. */
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

  /** Update quantity for a single holding (e.g. after buying more). */
  const updateQuantity = useMutation({
    mutationFn: async ({ id, quantity: q }: { id: string; quantity: number }) => {
      if (!Number.isFinite(q) || q <= 0) throw new Error("Invalid quantity");
      const price = liveKesPrice(live.data, holdings.data?.find((h) => h.id === id)?.symbol ?? "");
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
    <Card className="rounded-2xl border-amber-300/40 dark:border-amber-800/40">
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-base">
          <span className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
              <Bitcoin className="h-4 w-4" />
            </span>
            Binance crypto holdings
          </span>
          <span className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-lg"
              disabled={live.isFetching}
              onClick={() => void live.refetch()}
            >
              <RefreshCw className={cn("mr-1.5 h-3.5 w-3.5", live.isFetching && "animate-spin")} />
              Refresh prices
            </Button>
            <Button
              type="button"
              size="sm"
              className="rounded-lg"
              disabled={applyLivePrices.isPending || !live.data || (holdings.data ?? []).length === 0}
              onClick={() => applyLivePrices.mutate()}
            >
              <TrendingUp className="mr-1.5 h-3.5 w-3.5" />
              {applyLivePrices.isPending ? "Updating…" : "Apply live prices"}
            </Button>
          </span>
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Live prices from Binance public market data (no API keys). Quantity is what you hold;
          <strong> Apply live prices</strong> updates stored KES values when the market moves. This does
          not trade or connect to your Binance login.
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
          <p className="text-xs text-destructive">Live prices unavailable — enter KES manually.</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-4">
          <div className="space-y-1.5">
            <Label>Coin</Label>
            <Select
              value={symbol}
              onValueChange={(value) => {
                setSymbol(value as Coin);
                setPriceKes("");
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COINS.map((coin) => (
                  <SelectItem key={coin} value={coin}>
                    {coin}
                    {liveKesPrice(live.data, coin) != null
                      ? ` · ${formatMoney(liveKesPrice(live.data, coin)!, "KES")}`
                      : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Quantity</Label>
            <Input
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
            <Label>Price per coin (KES)</Label>
            <Input
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
            <Label>Note</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional"
            />
          </div>
        </div>
        <Button type="button" size="sm" onClick={() => save.mutate()} disabled={save.isPending}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          {save.isPending ? "Adding…" : "Add holding"}
        </Button>

        <div className="grid gap-2 sm:grid-cols-2">
          <div className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2 text-sm">
            <span className="text-muted-foreground">Stored value</span>
            <strong>{formatMoney(storedTotal, "KES")}</strong>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-amber-500/10 px-3 py-2 text-sm">
            <span className="text-muted-foreground">Live value</span>
            <strong className="text-amber-800 dark:text-amber-300">
              {liveTotal != null ? formatMoney(liveTotal, "KES") : "—"}
            </strong>
          </div>
        </div>

        <div className="space-y-2">
          {(holdings.data ?? []).map((holding) => {
            const storedValue = holding.quantity * holding.price_kes;
            const livePrice = liveKesPrice(live.data, holding.symbol);
            const liveValue =
              livePrice != null ? holding.quantity * livePrice : storedValue;
            const delta = liveValue - storedValue;
            const low = liveValue < 1000;
            return (
              <div
                key={holding.id}
                className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-3 py-2.5 ${low ? "border-red-300 bg-red-50/70 dark:border-red-900/60 dark:bg-red-950/20" : ""}`}
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-[10px] font-bold ${low ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300" : coinStyle(holding.symbol)}`}
                  >
                    {holding.symbol}
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium">
                      {holding.exchange} · {holding.symbol}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {holding.quantity} coins
                      {livePrice != null ? (
                        <>
                          {" · live "}
                          {formatMoney(livePrice, "KES")}
                          {" / coin"}
                        </>
                      ) : (
                        <>
                          {" · stored "}
                          {formatMoney(holding.price_kes, "KES")}
                        </>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-right">
                    <strong className={low ? "text-red-600 dark:text-red-400" : ""}>
                      {formatMoney(liveValue, "KES")}
                    </strong>
                    {livePrice != null && Math.abs(delta) >= 1 && (
                      <div
                        className={cn(
                          "text-[11px]",
                          delta >= 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400",
                        )}
                      >
                        {delta >= 0 ? "+" : ""}
                        {formatMoney(delta, "KES")} vs stored
                      </div>
                    )}
                  </div>
                  {low && (
                    <CircleAlert className="h-4 w-4 text-red-600" aria-label="Below KES 1,000" />
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-lg text-xs"
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
                    onClick={() => remove.mutate(holding.id)}
                    disabled={remove.isPending}
                    aria-label={`Remove ${holding.symbol}`}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            );
          })}
          {!holdings.isLoading && (holdings.data ?? []).length === 0 && (
            <p className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
              No crypto holdings recorded yet. Add your coin quantities — prices fill from Binance.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
