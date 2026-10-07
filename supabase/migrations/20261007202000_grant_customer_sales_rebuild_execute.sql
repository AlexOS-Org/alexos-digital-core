-- The atomic customer-sales RPC is security-invoker and must be able to call
-- its owner-scoped scorecard rebuild helper under the authenticated role.
grant execute on function public.banking_rebuild_weekly_scorecard(uuid, uuid, date)
  to authenticated;
