CREATE TABLE public.dg_cart_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  storefront_id uuid NOT NULL REFERENCES public.dg_storefronts(id) ON DELETE CASCADE,
  store_slug text NOT NULL,
  session_token_hash text NOT NULL UNIQUE,
  email text NOT NULL,
  first_name text,
  phone text,
  cart_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'KES',
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'converted', 'expired', 'opted_out')),
  consent_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  follow_up_sent_at timestamptz,
  follow_up_claimed_at timestamptz,
  converted_at timestamptz,
  last_error text,
  CHECK (jsonb_typeof(cart_json) = 'array'),
  CHECK (subtotal >= 0),
  CHECK (char_length(store_slug) BETWEEN 1 AND 120),
  CHECK (char_length(email) BETWEEN 3 AND 320),
  CHECK (currency ~ '^[A-Z]{3}$')
);

CREATE INDEX dg_cart_sessions_follow_up_idx
  ON public.dg_cart_sessions (status, follow_up_sent_at, created_at)
  WHERE status = 'pending' AND follow_up_sent_at IS NULL;

CREATE INDEX dg_cart_sessions_storefront_idx
  ON public.dg_cart_sessions (storefront_id, created_at DESC);

ALTER TABLE public.dg_cart_sessions ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.dg_cart_sessions FROM anon, authenticated;
GRANT ALL ON public.dg_cart_sessions TO service_role;

COMMENT ON TABLE public.dg_cart_sessions IS
  'Opt-in guest checkout recovery snapshots. Tokens are stored only as SHA-256 hashes; cart_json contains product and variant IDs, not trusted prices.';
COMMENT ON COLUMN public.dg_cart_sessions.consent_at IS
  'Timestamp when the shopper explicitly opted into one recovery reminder.';
COMMENT ON COLUMN public.dg_cart_sessions.follow_up_sent_at IS
  'At-most-once send marker for the single recovery reminder.';
COMMENT ON COLUMN public.dg_cart_sessions.follow_up_claimed_at IS
  'Short-lived worker claim used to prevent concurrent scheduled runs from sending duplicates.';
