-- The public catalogue RLS policies call this SECURITY DEFINER helper.
-- Keep its fixed public search_path and read-only boolean contract, but grant
-- execution to the roles that must evaluate those policies.
GRANT EXECUTE ON FUNCTION public.dg_is_published_store(uuid) TO anon, authenticated;
