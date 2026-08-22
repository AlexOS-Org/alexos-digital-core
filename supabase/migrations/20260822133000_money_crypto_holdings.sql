CREATE TABLE IF NOT EXISTS public.money_crypto_holdings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exchange text NOT NULL DEFAULT 'Binance',
  symbol text NOT NULL CHECK (symbol IN ('BTC','ETH','BNB','SOL','XRP','USDT','USDC')),
  quantity numeric(24,10) NOT NULL CHECK (quantity >= 0),
  price_kes numeric(18,2) NOT NULL CHECK (price_kes >= 0),
  valued_at timestamptz NOT NULL DEFAULT now(),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS money_crypto_holdings_user_idx
  ON public.money_crypto_holdings (user_id, symbol);

ALTER TABLE public.money_crypto_holdings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS money_crypto_holdings_owner_select ON public.money_crypto_holdings;
CREATE POLICY money_crypto_holdings_owner_select
  ON public.money_crypto_holdings FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS money_crypto_holdings_owner_insert ON public.money_crypto_holdings;
CREATE POLICY money_crypto_holdings_owner_insert
  ON public.money_crypto_holdings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS money_crypto_holdings_owner_update ON public.money_crypto_holdings;
CREATE POLICY money_crypto_holdings_owner_update
  ON public.money_crypto_holdings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS money_crypto_holdings_owner_delete ON public.money_crypto_holdings;
CREATE POLICY money_crypto_holdings_owner_delete
  ON public.money_crypto_holdings FOR DELETE
  USING (auth.uid() = user_id);

REVOKE ALL ON public.money_crypto_holdings FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.money_crypto_holdings TO authenticated;

COMMENT ON TABLE public.money_crypto_holdings IS
  'Manual Binance crypto holdings. Price is user-entered KES valuation; holdings are assets, not income or expenses.';
COMMENT ON COLUMN public.money_crypto_holdings.price_kes IS
  'Manual current KES price per unit. This is not an automatic market-price feed.';
