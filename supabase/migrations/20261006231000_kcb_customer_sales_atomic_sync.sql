-- Atomic customer-sale workflow.
-- One RPC call inserts/updates the sale, upserts its evidence, and rebuilds the
-- affected weekly scorecard rows in the same transaction.

create or replace function public.banking_customer_sales_atomic_sync(
  p_operation text,
  p_contract_id uuid,
  p_kpi_id uuid default null,
  p_sale jsonb default '{}'::jsonb,
  p_sale_id uuid default null,
  p_qualification_status text default null,
  p_qualified_value numeric default null
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_sale public.banking_customer_sales%rowtype;
  v_week_start date;
  v_week_end date;
begin
  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  if p_operation not in ('create', 'qualify') then
    raise exception 'Unsupported customer sale operation: %', p_operation using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.banking_performance_contracts c
    where c.id = p_contract_id and c.user_id = v_user_id
  ) then
    raise exception 'Contract is not owned by the authenticated user' using errcode = '42501';
  end if;

  if p_operation = 'create' then
    if p_kpi_id is null then
      raise exception 'KPI is required' using errcode = '22023';
    end if;

    if not exists (
      select 1
      from public.banking_contract_kpis k
      where k.id = p_kpi_id
        and k.contract_id = p_contract_id
        and k.user_id = v_user_id
        and k.active = true
    ) then
      raise exception 'KPI is not active for the selected contract' using errcode = '42501';
    end if;

    insert into public.banking_customer_sales (
      user_id,
      contract_id,
      kpi_id,
      sale_date,
      customer_name,
      customer_reference,
      product_name,
      product_status,
      amount,
      quantity,
      actual_value,
      qualified_value,
      qualification_status,
      evidence_reference,
      notes
    ) values (
      v_user_id,
      p_contract_id,
      p_kpi_id,
      coalesce((p_sale->>'sale_date')::date, current_date),
      trim(coalesce(p_sale->>'customer_name', '')),
      nullif(trim(p_sale->>'customer_reference'), ''),
      trim(coalesce(p_sale->>'product_name', '')),
      coalesce(p_sale->>'product_status', 'sold'),
      coalesce((p_sale->>'amount')::numeric, 0),
      coalesce((p_sale->>'quantity')::numeric, 1),
      coalesce((p_sale->>'actual_value')::numeric, 0),
      coalesce((p_sale->>'qualified_value')::numeric, 0),
      coalesce(p_sale->>'qualification_status', 'pending'),
      nullif(trim(p_sale->>'evidence_reference'), ''),
      nullif(trim(p_sale->>'notes'), '')
    )
    returning * into v_sale;
  else
    if p_sale_id is null or p_qualification_status is null or p_qualified_value is null then
      raise exception 'Sale ID, qualification status, and qualified value are required' using errcode = '22023';
    end if;

    select * into v_sale
    from public.banking_customer_sales
    where id = p_sale_id
      and contract_id = p_contract_id
      and user_id = v_user_id
    for update;

    if not found then
      raise exception 'Customer sale was not found for this user and contract' using errcode = 'P0002';
    end if;

    update public.banking_customer_sales
    set qualification_status = p_qualification_status,
        qualified_value = p_qualified_value
    where id = v_sale.id
    returning * into v_sale;
  end if;

  v_week_start := v_sale.sale_date - (extract(isodow from v_sale.sale_date)::integer - 1);
  v_week_end := v_week_start + 6;

  -- The partial unique index on source_sale_id makes this an idempotent evidence upsert.
  insert into public.banking_performance_evidence (
    source_sale_id,
    contract_id,
    kpi_id,
    user_id,
    evidence_date,
    evidence_type,
    reference_text,
    amount,
    status,
    notes
  ) values (
    v_sale.id,
    v_sale.contract_id,
    v_sale.kpi_id,
    v_user_id,
    v_sale.sale_date,
    'customer sale record',
    v_sale.customer_name || ' — ' || v_sale.product_name || ': ' || coalesce(v_sale.evidence_reference, 'Customer sale ledger record'),
    v_sale.amount,
    v_sale.qualification_status,
    v_sale.notes
  )
  on conflict (source_sale_id) where source_sale_id is not null
  do update set
    evidence_date = excluded.evidence_date,
    evidence_type = excluded.evidence_type,
    reference_text = excluded.reference_text,
    amount = excluded.amount,
    status = excluded.status,
    notes = excluded.notes,
    updated_at = now();

  -- Rebuild every KPI for the affected week from the complete ledger range.
  -- No client-provided scorecard totals are trusted here.
  insert into public.banking_weekly_performance (
    contract_id,
    kpi_id,
    user_id,
    week_start,
    actual_value,
    qualified_value,
    target_value,
    achievement_percent,
    weighted_contribution,
    next_action
  )
  select
    p_contract_id,
    k.id,
    v_user_id,
    v_week_start,
    coalesce(sum(case
      when s.product_status <> 'cancelled' then s.actual_value
      else 0
    end), 0),
    coalesce(sum(case
      when s.product_status <> 'cancelled' and s.qualification_status = 'verified'
        then s.qualified_value
      else 0
    end), 0),
    case
      when k.target_period = 'weekly' then k.target_value
      when k.target_period = 'monthly' then k.target_value / 4.33
      when k.target_period = 'rolling_3_month' then k.target_value / 13
      else k.target_value
    end,
    case
      when case
        when k.target_period = 'weekly' then k.target_value
        when k.target_period = 'monthly' then k.target_value / 4.33
        when k.target_period = 'rolling_3_month' then k.target_value / 13
        else k.target_value
      end <= 0 then 0
      else greatest(0, coalesce(sum(case
        when s.product_status <> 'cancelled' and s.qualification_status = 'verified'
          then s.qualified_value
        else 0
      end), 0)) /
        case
          when k.target_period = 'weekly' then k.target_value
          when k.target_period = 'monthly' then k.target_value / 4.33
          when k.target_period = 'rolling_3_month' then k.target_value / 13
          else k.target_value
        end * 100
    end,
    (
      least(100, case
        when case
          when k.target_period = 'weekly' then k.target_value
          when k.target_period = 'monthly' then k.target_value / 4.33
          when k.target_period = 'rolling_3_month' then k.target_value / 13
          else k.target_value
        end <= 0 then 0
        else greatest(0, coalesce(sum(case
          when s.product_status <> 'cancelled' and s.qualification_status = 'verified'
            then s.qualified_value
          else 0
        end), 0)) /
          case
            when k.target_period = 'weekly' then k.target_value
            when k.target_period = 'monthly' then k.target_value / 4.33
            when k.target_period = 'rolling_3_month' then k.target_value / 13
            else k.target_value
          end * 100
      end) * k.weight_percent / 100
    ),
    k.improvement_action
  from public.banking_contract_kpis k
  left join public.banking_customer_sales s
    on s.kpi_id = k.id
   and s.contract_id = p_contract_id
   and s.user_id = v_user_id
   and s.sale_date between v_week_start and v_week_end
  where k.contract_id = p_contract_id
    and k.user_id = v_user_id
    and k.active = true
  group by k.id, k.target_period, k.target_value, k.weight_percent, k.improvement_action
  on conflict (contract_id, kpi_id, week_start)
  do update set
    actual_value = excluded.actual_value,
    qualified_value = excluded.qualified_value,
    target_value = excluded.target_value,
    achievement_percent = excluded.achievement_percent,
    weighted_contribution = excluded.weighted_contribution,
    updated_at = now();

  return jsonb_build_object(
    'sale', to_jsonb(v_sale),
    'week_start', v_week_start,
    'week_end', v_week_end
  );
end;
$$;

revoke all on function public.banking_customer_sales_atomic_sync(
  text, uuid, uuid, jsonb, uuid, text, numeric
) from public, anon;
grant execute on function public.banking_customer_sales_atomic_sync(
  text, uuid, uuid, jsonb, uuid, text, numeric
) to authenticated;

comment on function public.banking_customer_sales_atomic_sync(text, uuid, uuid, jsonb, uuid, text, numeric) is
  'Atomically records or qualifies a customer sale, upserts its evidence, and rebuilds the affected weekly scorecard from the complete bounded ledger range.';
