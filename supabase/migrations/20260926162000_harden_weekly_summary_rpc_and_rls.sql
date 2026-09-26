-- Keep weekly summary claim/complete operations server-only and optimize
-- authenticated-user policy evaluation with a statement-stable auth.uid() call.

revoke execute on function public.claim_money_weekly_summary_send(uuid, date, text)
  from public, anon, authenticated;
revoke execute on function public.complete_money_weekly_summary_send(uuid, date, text)
  from public, anon, authenticated;
grant execute on function public.claim_money_weekly_summary_send(uuid, date, text)
  to service_role;
grant execute on function public.complete_money_weekly_summary_send(uuid, date, text)
  to service_role;

drop policy if exists "Users can read their weekly summary preference"
  on public.money_weekly_summary_preferences;
drop policy if exists "Users can insert their weekly summary preference"
  on public.money_weekly_summary_preferences;
drop policy if exists "Users can update their weekly summary preference"
  on public.money_weekly_summary_preferences;

create policy "Users can read their weekly summary preference"
  on public.money_weekly_summary_preferences
  for select
  using (user_id = (select auth.uid()));

create policy "Users can insert their weekly summary preference"
  on public.money_weekly_summary_preferences
  for insert
  with check (user_id = (select auth.uid()));

create policy "Users can update their weekly summary preference"
  on public.money_weekly_summary_preferences
  for update
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
