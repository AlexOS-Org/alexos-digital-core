import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bitcoin, CircleAlert, Plus, Trash2 } from "lucide-react";
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
  const save = useMutation({
    mutationFn: async () => {
      const q = Number(quantity);
      const price = Number(priceKes);
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
  const total = useMemo(
    () =>
      (holdings.data ?? []).reduce((sum, holding) => sum + holding.quantity * holding.price_kes, 0),
    [holdings.data],
  );

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
            <Bitcoin className="h-4 w-4" />
          </span>
          Binance crypto holdings
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Track major coins manually. These are assets, not income or expenses. Enter the current
          KES value yourself.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-4">
          <div className="space-y-1.5">
            <Label>Coin</Label>
            <Select value={symbol} onValueChange={(value) => setSymbol(value as Coin)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COINS.map((coin) => (
                  <SelectItem key={coin} value={coin}>
                    {coin}
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
              value={priceKes}
              onChange={(e) => setPriceKes(e.target.value)}
              placeholder="0"
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
        <div className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2 text-sm">
          <span className="text-muted-foreground">Tracked crypto value</span>
          <strong>{formatMoney(total, "KES")}</strong>
        </div>
        <div className="space-y-2">
          {(holdings.data ?? []).map((holding) => {
            const value = holding.quantity * holding.price_kes;
            const low = value < 1000;
            return (
              <div
                key={holding.id}
                className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 ${low ? "border-red-300 bg-red-50/70 dark:border-red-900/60 dark:bg-red-950/20" : ""}`}
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
                      {holding.quantity} × {formatMoney(holding.price_kes, "KES")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <strong className={low ? "text-red-600 dark:text-red-400" : ""}>
                    {formatMoney(value, "KES")}
                  </strong>
                  {low && (
                    <CircleAlert className="h-4 w-4 text-red-600" aria-label="Below KES 1,000" />
                  )}
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
              No crypto holdings recorded yet.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
