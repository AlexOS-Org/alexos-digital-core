-- Lock server-only operational tables to service_role.
-- These tables are never queried directly by anon/authenticated clients.
-- RLS remains enabled; explicit deny policies make the intent visible to
-- security advisors and provide defense in depth alongside revoked grants.

revoke all on table public.auren_evidence_refresh_runs from anon, authenticated;
revoke all on table public.dg_cart_sessions from anon, authenticated;

drop policy if exists "deny anon access to auren refresh runs" on public.auren_evidence_refresh_runs;
create policy "deny anon access to auren refresh runs"
  on public.auren_evidence_refresh_runs
  for all to anon
  using (false)
  with check (false);

drop policy if exists "deny authenticated access to auren refresh runs" on public.auren_evidence_refresh_runs;
create policy "deny authenticated access to auren refresh runs"
  on public.auren_evidence_refresh_runs
  for all to authenticated
  using (false)
  with check (false);

drop policy if exists "deny anon access to cart sessions" on public.dg_cart_sessions;
create policy "deny anon access to cart sessions"
  on public.dg_cart_sessions
  for all to anon
  using (false)
  with check (false);

drop policy if exists "deny authenticated access to cart sessions" on public.dg_cart_sessions;
create policy "deny authenticated access to cart sessions"
  on public.dg_cart_sessions
  for all to authenticated
  using (false)
  with check (false);

comment on table public.auren_evidence_refresh_runs is
  'Server-only Auren refresh audit table. Access is restricted to service_role.';
comment on table public.dg_cart_sessions is
  'Server-only abandoned-cart session table. Access is restricted to service_role.';
