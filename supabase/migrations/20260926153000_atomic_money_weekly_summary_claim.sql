-- Serialize weekly summary sends per user and period.
-- The claim update is atomic under PostgreSQL row locking, so concurrent
-- Worker invocations cannot both claim the same recipient for the same week.

alter table public.money_weekly_summary_preferences
  add column if not exists send_claim_period date,
  add column if not exists send_claim_token text,
  add column if not exists send_claimed_at timestamptz;

create or replace function public.claim_money_weekly_summary_send(
  p_user_id uuid,
  p_period date,
  p_claim_token text
)
returns boolean
language sql
security definer
set search_path = public
as $$
  update public.money_weekly_summary_preferences
  set send_claim_period = p_period,
      send_claim_token = p_claim_token,
      send_claimed_at = now(),
      updated_at = now()
  where user_id = p_user_id
    and enabled = true
    and last_sent_period is distinct from p_period
    and (
      send_claim_period is distinct from p_period
      or send_claimed_at is null
      or send_claimed_at < now() - interval '30 minutes'
    )
  returning true;
$$;

create or replace function public.complete_money_weekly_summary_send(
  p_user_id uuid,
  p_period date,
  p_claim_token text
)
returns boolean
language sql
security definer
set search_path = public
as $$
  update public.money_weekly_summary_preferences
  set last_sent_period = p_period,
      send_claim_period = null,
      send_claim_token = null,
      send_claimed_at = null,
      updated_at = now()
  where user_id = p_user_id
    and send_claim_period = p_period
    and send_claim_token = p_claim_token
  returning true;
$$;

revoke all on function public.claim_money_weekly_summary_send(uuid, date, text) from public;
revoke all on function public.complete_money_weekly_summary_send(uuid, date, text) from public;
grant execute on function public.claim_money_weekly_summary_send(uuid, date, text) to service_role;
grant execute on function public.complete_money_weekly_summary_send(uuid, date, text) to service_role;
