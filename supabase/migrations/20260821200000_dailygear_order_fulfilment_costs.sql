-- DailyGear order fulfilment costs.
-- Each cost type is recorded once per order and links to at most one posted
-- Money Center expense transaction. Repeating the same save is idempotent;
-- changing an already-posted amount or account is rejected to preserve history.

create table public.dg_order_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid not null references public.dg_orders(id) on delete cascade,
  cost_type text not null check (cost_type in ('purchase_cost', 'delivery', 'other')),
  amount numeric(18,2) not null default 0 check (amount >= 0),
  account_id uuid references public.accounts(id) on delete restrict,
  description text,
  money_transaction_id uuid references public.transactions(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint dg_order_expenses_amount_account_check check (amount = 0 or account_id is not null),
  constraint dg_order_expenses_order_type_unique unique (order_id, cost_type)
);

grant select on public.dg_order_expenses to authenticated;
grant all on public.dg_order_expenses to service_role;
alter table public.dg_order_expenses enable row level security;

create policy "DailyGear owners can view their order expenses"
  on public.dg_order_expenses for select
  to authenticated
  using ((select auth.uid()) = user_id);

create index dg_order_expenses_user_order_idx
  on public.dg_order_expenses(user_id, order_id);
create index dg_order_expenses_transaction_idx
  on public.dg_order_expenses(money_transaction_id)
  where money_transaction_id is not null;
create trigger dg_order_expenses_updated
  before update on public.dg_order_expenses
  for each row execute function public.update_updated_at_column();

create or replace function public.dg_record_order_fulfilment(
  p_order_id uuid,
  p_purchase_cost numeric default 0,
  p_delivery_cost numeric default 0,
  p_other_cost numeric default 0,
  p_account_id uuid default null,
  p_other_description text default null,
  p_next_status public.dg_order_status default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_order public.dg_orders%rowtype;
  v_existing public.dg_order_expenses%rowtype;
  v_cost jsonb;
  v_type text;
  v_amount numeric;
  v_description text;
  v_expense_type text;
  v_transaction_id uuid;
  v_has_existing boolean;
  v_status public.dg_order_status;
  v_costs jsonb := '[]'::jsonb;
begin
  if v_user_id is null then
    raise exception 'You must be signed in.';
  end if;

  if coalesce(p_purchase_cost, 0) < 0
     or coalesce(p_delivery_cost, 0) < 0
     or coalesce(p_other_cost, 0) < 0 then
    raise exception 'Fulfilment costs cannot be negative.';
  end if;

  select * into v_order
  from public.dg_orders
  where id = p_order_id
    and user_id = v_user_id
    and deleted_at is null
  for update;

  if not found then
    raise exception 'Order not found or unavailable.';
  end if;

  if p_next_status is not null then
    if p_next_status not in ('processing', 'packed') then
      raise exception 'Fulfilment can only move an order to processing or packed.';
    end if;
    if v_order.status = 'new' and p_next_status <> 'processing' then
      raise exception 'A new order must move to processing before it can be packed.';
    end if;
    if v_order.status = 'processing' and p_next_status <> 'packed' then
      raise exception 'A processing order can only move to packed.';
    end if;
    if v_order.status not in ('new', 'processing') then
      raise exception 'Fulfilment costs cannot move a completed or cancelled order backward.';
    end if;
  end if;

  for v_cost in
    select value
    from jsonb_array_elements(
      jsonb_build_array(
        jsonb_build_object(
          'cost_type', 'purchase_cost',
          'amount', coalesce(p_purchase_cost, 0),
          'description', 'Purchase cost'
        ),
        jsonb_build_object(
          'cost_type', 'delivery',
          'amount', coalesce(p_delivery_cost, 0),
          'description', 'Delivery cost'
        ),
        jsonb_build_object(
          'cost_type', 'other',
          'amount', coalesce(p_other_cost, 0),
          'description', coalesce(nullif(left(p_other_description, 200), ''), 'Other fulfilment cost')
        )
      )
    )
  loop
    v_type := v_cost->>'cost_type';
    v_amount := (v_cost->>'amount')::numeric;
    v_description := v_cost->>'description';
    v_expense_type := case v_type
      when 'purchase_cost' then 'cost_of_goods'
      when 'delivery' then 'delivery'
      else 'other'
    end;

    select * into v_existing
    from public.dg_order_expenses
    where order_id = p_order_id
      and user_id = v_user_id
      and cost_type = v_type
    for update;
    v_has_existing := found;

    if v_has_existing and v_existing.money_transaction_id is not null then
      if v_existing.amount is distinct from v_amount
         or v_existing.account_id is distinct from p_account_id then
        raise exception 'The % cost for this order is already posted. Void or correct it in Money Center instead of rewriting history.', v_type;
      end if;
      v_costs := v_costs || jsonb_build_array(jsonb_build_object(
        'costType', v_type,
        'amount', v_existing.amount,
        'accountId', v_existing.account_id,
        'moneyTransactionId', v_existing.money_transaction_id,
        'posted', true
      ));
      continue;
    end if;

    if v_amount > 0 then
      if p_account_id is null then
        raise exception 'Select the Money Center account that paid the fulfilment costs.';
      end if;
      perform 1
      from public.accounts
      where id = p_account_id
        and user_id = v_user_id
        and status = 'active'
        and deleted_at is null;
      if not found then
        raise exception 'The selected Money Center account is unavailable.';
      end if;
    end if;

    if v_has_existing then
      update public.dg_order_expenses
      set amount = v_amount,
          account_id = p_account_id,
          description = v_description,
          updated_at = now()
      where id = v_existing.id;
    else
      insert into public.dg_order_expenses (
        user_id, order_id, cost_type, amount, account_id, description
      ) values (
        v_user_id, p_order_id, v_type, v_amount, p_account_id, v_description
      );
    end if;

    if v_amount > 0 then
      insert into public.transactions (
        user_id,
        occurred_at,
        type,
        account_id,
        category,
        source,
        description,
        reference,
        amount,
        status,
        financial_scope,
        business_name,
        flow_type,
        principal_amount,
        interest_amount,
        expense_type
      ) values (
        v_user_id,
        now(),
        'expense',
        p_account_id,
        v_description,
        'DailyGear order fulfilment',
        format('%s — %s', v_order.order_number, v_description),
        format('%s:%s', v_order.order_number, v_type),
        v_amount,
        'posted',
        'business',
        'DailyGear',
        'standard',
        0,
        0,
        v_expense_type
      ) returning id into v_transaction_id;

      update public.dg_order_expenses
      set money_transaction_id = v_transaction_id,
          updated_at = now()
      where order_id = p_order_id
        and user_id = v_user_id
        and cost_type = v_type;
    else
      v_transaction_id := null;
    end if;

    v_costs := v_costs || jsonb_build_array(jsonb_build_object(
      'costType', v_type,
      'amount', v_amount,
      'accountId', p_account_id,
      'moneyTransactionId', v_transaction_id,
      'posted', v_transaction_id is not null
    ));
  end loop;

  v_status := coalesce(p_next_status, v_order.status);
  if p_next_status is not null then
    update public.dg_orders
    set status = p_next_status,
        updated_at = now()
    where id = p_order_id
      and user_id = v_user_id;

    insert into public.dg_order_events (user_id, order_id, type, title, body)
    values (
      v_user_id,
      p_order_id,
      'updated',
      'Fulfilment costs recorded',
      format('Costs were recorded and the order moved to %s. Each non-zero cost links to one Money Center expense.', replace(p_next_status::text, '_', ' '))
    );
  else
    insert into public.dg_order_events (user_id, order_id, type, title, body)
    values (
      v_user_id,
      p_order_id,
      'updated',
      'Fulfilment costs recorded',
      'Each non-zero cost links to one Money Center expense. Order status was preserved.'
    );
  end if;

  return jsonb_build_object(
    'orderId', p_order_id,
    'status', v_status,
    'costs', v_costs
  );
end;
$$;

revoke execute on function public.dg_record_order_fulfilment(
  uuid, numeric, numeric, numeric, uuid, text, public.dg_order_status
) from public, anon;
grant execute on function public.dg_record_order_fulfilment(
  uuid, numeric, numeric, numeric, uuid, text, public.dg_order_status
) to authenticated;
