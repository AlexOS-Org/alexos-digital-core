-- Phase A: M-Pesa STK attempt log (server-only). No auto settlement.
-- Callbacks update this table; order payment still uses admin confirm or a later Phase B path.

create table if not exists public.dg_mpesa_stk_attempts (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.dg_orders (id) on delete cascade,
  order_number text not null,
  phone text not null,
  amount numeric(12, 2) not null check (amount > 0),
  currency text not null default 'KES',
  account_reference text not null,
  transaction_desc text not null,
  merchant_request_id text,
  checkout_request_id text,
  status text not null default 'initiated'
    check (status in ('initiated', 'pending', 'success', 'failed', 'cancelled', 'timeout')),
  result_code integer,
  result_desc text,
  mpesa_receipt_number text,
  callback_amount numeric(12, 2),
  callback_phone text,
  transaction_date text,
  raw_initiate jsonb,
  raw_callback jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists dg_mpesa_stk_attempts_checkout_request_id_uidx
  on public.dg_mpesa_stk_attempts (checkout_request_id)
  where checkout_request_id is not null;

create index if not exists dg_mpesa_stk_attempts_order_id_idx
  on public.dg_mpesa_stk_attempts (order_id, created_at desc);

create index if not exists dg_mpesa_stk_attempts_order_number_idx
  on public.dg_mpesa_stk_attempts (order_number, created_at desc);

comment on table public.dg_mpesa_stk_attempts is
  'Server-only M-Pesa STK push attempts. Phase A logs initiate + callback only; does not auto-post payments.';

alter table public.dg_mpesa_stk_attempts enable row level security;

revoke all on table public.dg_mpesa_stk_attempts from anon, authenticated;

drop policy if exists "deny anon access to mpesa stk attempts" on public.dg_mpesa_stk_attempts;
create policy "deny anon access to mpesa stk attempts"
  on public.dg_mpesa_stk_attempts
  for all to anon
  using (false)
  with check (false);

drop policy if exists "deny authenticated access to mpesa stk attempts" on public.dg_mpesa_stk_attempts;
create policy "deny authenticated access to mpesa stk attempts"
  on public.dg_mpesa_stk_attempts
  for all to authenticated
  using (false)
  with check (false);

grant select, insert, update, delete on table public.dg_mpesa_stk_attempts to service_role;
