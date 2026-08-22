-- Auren refresh-run privacy hardening.
-- Refresh runs are scheduler metadata and are not exposed to authenticated clients.

revoke all on public.auren_evidence_refresh_runs from authenticated;
drop policy if exists "authenticated can read auren refresh runs" on public.auren_evidence_refresh_runs;
