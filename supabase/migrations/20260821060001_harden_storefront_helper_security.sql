-- The helper only checks rows already visible through dg_storefronts RLS.
-- SECURITY INVOKER preserves the boolean publication check without exposing a
-- privileged API function to anonymous or authenticated callers.
CREATE OR REPLACE FUNCTION public.dg_is_published_store(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.dg_storefronts
    WHERE user_id = _user_id
      AND published = true
  )
$$;
