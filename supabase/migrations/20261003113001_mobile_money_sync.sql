-- Mobile money device ownership and canonical transaction ingestion.
-- The only persisted money record is public.transactions; payloads never include
-- or retain the source SMS. All user identity comes from auth.uid().

create table public.mobile_sync_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  device_label text not null check (char_length(device_label) between 1 and 60),
  platform text not null check (platform in ('android', 'ios', 'other')),
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  unique (user_id, id)
);

create index mobile_sync_devices_user_id_idx
  on public.mobile_sync_devices(user_id, created_at desc);

alter table public.mobile_sync_devices enable row level security;

create policy "mobile devices are readable by their owner"
  on public.mobile_sync_devices for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "users can register their own mobile devices"
  on public.mobile_sync_devices for insert to authenticated
  with check ((select auth.uid()) = user_id);

grant select, insert on public.mobile_sync_devices to authenticated;
revoke update, delete on public.mobile_sync_devices from anon, authenticated;

alter table public.transactions
  add column mobile_device_id uuid,
  add column mobile_provider text,
  add column mobile_provider_reference text,
  add column mobile_fingerprint text;

alter table public.transactions
  add constraint transactions_mobile_provider_check
    check (mobile_provider is null or mobile_provider in ('mpesa', 'airtel_money', 'bank_sms', 'other')),
  add constraint transactions_mobile_metadata_check
    check (
      (mobile_device_id is null and mobile_provider is null
        and mobile_provider_reference is null and mobile_fingerprint is null)
      or
      (mobile_device_id is not null and mobile_provider is not null
        and mobile_fingerprint is not null
        and mobile_fingerprint ~ '^[a-f0-9]{64}$')
    ),
  add constraint transactions_mobile_device_owner_fkey
    foreign key (user_id, mobile_device_id)
    references public.mobile_sync_devices(user_id, id);

create unique index transactions_mobile_provider_reference_unique
  on public.transactions(user_id, mobile_provider, mobile_provider_reference)
  where mobile_provider is not null and mobile_provider_reference is not null;

create unique index transactions_mobile_fingerprint_unique
  on public.transactions(user_id, mobile_provider, mobile_fingerprint)
  where mobile_provider is not null and mobile_provider_reference is null;

comment on table public.mobile_sync_devices is
  'Authenticated user-owned mobile sync registrations. Device IDs are identifiers, never credentials.';
comment on column public.transactions.mobile_fingerprint is
  'SHA-256 of canonical normalized transaction fields; used only when the provider has no reliable reference.';

-- Revocation is one-way. This narrowly scoped SECURITY DEFINER function updates
-- only the caller-owned device and exposes no data or other mutation capability.
create or replace function public.mobile_revoke_device(p_device_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_rows bigint;
begin
  if (select auth.uid()) is null then
    return false;
  end if;

  update public.mobile_sync_devices
  set revoked_at = now()
  where id = p_device_id
    and user_id = (select auth.uid())
    and revoked_at is null;

  get diagnostics v_rows = row_count;
  return v_rows > 0;
end;
$$;

revoke all on function public.mobile_revoke_device(uuid) from public, anon;
grant execute on function public.mobile_revoke_device(uuid) to authenticated;

-- A single invoker RPC validates the caller, device, account and business and
-- inserts one canonical ledger row. The partial unique indexes above arbitrate
-- concurrent retries; there is no check-then-insert window.
create or replace function public.mobile_ingest_transaction(
  p_device_id uuid,
  p_account_id uuid,
  p_provider text,
  p_provider_reference text,
  p_fingerprint text,
  p_amount numeric,
  p_occurred_at timestamptz,
  p_direction text,
  p_transaction_type text,
  p_classification_confirmed boolean,
  p_transfer_account_id uuid default null
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_device public.mobile_sync_devices%rowtype;
  v_account public.accounts%rowtype;
  v_transfer_account public.accounts%rowtype;
  v_business public.businesses%rowtype;
  v_transaction_id uuid;
  v_existing public.transactions%rowtype;
  v_business_id uuid;
  v_business_name text;
begin
  if v_user_id is null then
    return jsonb_build_object('status', 'unauthorized');
  end if;

  select * into v_device
  from public.mobile_sync_devices
  where id = p_device_id and user_id = v_user_id;

  if not found or v_device.revoked_at is not null then
    return jsonb_build_object('status', 'invalid_device');
  end if;

  select * into v_account
  from public.accounts
  where id = p_account_id
    and user_id = v_user_id
    and status = 'active'
    and deleted_at is null;

  if not found then
    return jsonb_build_object('status', 'invalid_account');
  end if;

  v_business_id := v_account.business_id;
  if v_business_id is not null then
    select * into v_business
    from public.businesses
    where id = v_business_id
      and user_id = v_user_id
      and status = 'active';

    if not found then
      return jsonb_build_object('status', 'invalid_scope');
    end if;
    v_business_name := v_business.name;
  elsif v_account.financial_scope = 'business' then
    return jsonb_build_object('status', 'invalid_scope');
  end if;

  if p_provider is null
    or p_provider not in ('mpesa', 'airtel_money', 'bank_sms', 'other')
    or p_direction is null
    or p_direction not in ('CREDIT', 'DEBIT')
    or p_transaction_type is null
    or p_transaction_type not in ('income', 'expense', 'transfer')
    or p_classification_confirmed is distinct from true
    or (p_transaction_type = 'income' and p_direction <> 'CREDIT')
    or (p_transaction_type = 'expense' and p_direction <> 'DEBIT')
    or (p_transaction_type <> 'transfer' and p_transfer_account_id is not null)
    or (p_transaction_type = 'transfer' and p_transfer_account_id is null)
    or p_amount is null
    or p_amount <= 0
    or p_amount > 9999999999999999.99
    or p_amount <> round(p_amount, 2)
    or p_occurred_at is null
    or (p_provider_reference is not null and (
      char_length(p_provider_reference) not between 1 and 100
      or p_provider_reference !~ '^[A-Za-z0-9_-]+$'
    ))
    or p_fingerprint is null
    or p_fingerprint !~ '^[a-f0-9]{64}$'
  then
    return jsonb_build_object('status', 'invalid_payload');
  end if;

  if p_transaction_type = 'transfer' then
    select * into v_transfer_account
    from public.accounts
    where id = p_transfer_account_id
      and user_id = v_user_id
      and status = 'active'
      and deleted_at is null;

    if not found or v_transfer_account.id = v_account.id then
      return jsonb_build_object('status', 'invalid_transfer_account');
    end if;
  end if;

  insert into public.transactions (
    user_id, account_id, transfer_account_id, business_id, business_name, financial_scope,
    expense_scope, type, amount, occurred_at, description, category,
    source, reference, status, mobile_device_id, mobile_provider,
    mobile_provider_reference, mobile_fingerprint
  ) values (
    v_user_id, v_account.id, p_transfer_account_id, v_business_id, v_business_name,
    v_account.financial_scope,
    case when p_transaction_type = 'expense' then v_account.financial_scope else 'personal' end,
    p_transaction_type::public.transaction_type, p_amount, p_occurred_at,
    null, null, 'mobile_money_sync', p_provider_reference,
    'posted', v_device.id, p_provider, p_provider_reference, p_fingerprint
  ) on conflict do nothing
  returning id into v_transaction_id;

  if v_transaction_id is not null then
    return jsonb_build_object('status', 'inserted', 'transaction_id', v_transaction_id);
  end if;

  if p_provider_reference is not null then
    select * into v_existing
    from public.transactions
    where user_id = v_user_id
      and mobile_provider = p_provider
      and mobile_provider_reference = p_provider_reference
    limit 1;

    if found then
      if v_existing.mobile_fingerprint = p_fingerprint then
        return jsonb_build_object('status', 'duplicate', 'transaction_id', v_existing.id);
      end if;
      return jsonb_build_object('status', 'duplicate_conflict');
    end if;
  else
    select * into v_existing
    from public.transactions
    where user_id = v_user_id
      and mobile_provider = p_provider
      and mobile_provider_reference is null
      and mobile_fingerprint = p_fingerprint
    limit 1;

    if found then
      return jsonb_build_object('status', 'duplicate', 'transaction_id', v_existing.id);
    end if;
  end if;

  return jsonb_build_object('status', 'duplicate_conflict');
end;
$$;

revoke all on function public.mobile_ingest_transaction(
  uuid, uuid, text, text, text, numeric, timestamptz, text, text, uuid, boolean
) from public, anon;
grant execute on function public.mobile_ingest_transaction(
  uuid, uuid, text, text, text, numeric, timestamptz, text, text, boolean
) to authenticated;
