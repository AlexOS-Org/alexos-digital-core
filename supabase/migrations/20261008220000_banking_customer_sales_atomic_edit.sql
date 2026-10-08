-- Atomically edit a customer sale, including KPI/product, evidence, and affected weekly scorecards.

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
  v_week_starts date[];
  v_deleted_count integer := 0;
  v_kpi_unit text;
  v_actual_value numeric;
  v_qualified_value numeric;
  v_kpi_id uuid;
  v_old_week_start date;
  v_new_week_start date;
  v_is_admin boolean := coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'owner'), false
  );
begin
  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  if p_operation not in ('create', 'update', 'qualify', 'delete', 'delete_test_entries') then
    raise exception 'Unsupported customer sale operation: %', p_operation using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.banking_performance_contracts c
    where c.id = p_contract_id and c.user_id = v_user_id
  ) then
    raise exception 'Contract is not owned by the authenticated user' using errcode = '42501';
  end if;

  if p_operation = 'create' then
    if p_kpi_id is null then raise exception 'KPI is required' using errcode = '22023'; end if;
    if not exists (
      select 1 from public.banking_contract_kpis k
      where k.id = p_kpi_id and k.contract_id = p_contract_id
        and k.user_id = v_user_id and k.active = true
    ) then
      raise exception 'KPI is not active for the selected contract' using errcode = '42501';
    end if;

    select k.unit into v_kpi_unit
    from public.banking_contract_kpis k
    where k.id = p_kpi_id and k.contract_id = p_contract_id and k.user_id = v_user_id;

    v_actual_value := case
      when lower(v_kpi_unit) like '%kes%' then coalesce((p_sale->>'amount')::numeric, 0)
      when lower(v_kpi_unit) like '%account%'
        or lower(v_kpi_unit) like '%merchant%'
        or lower(v_kpi_unit) like '%qualified accounts%' then coalesce((p_sale->>'quantity')::numeric, 1)
      else coalesce((p_sale->>'actual_value')::numeric, 0)
    end;

    v_qualified_value := case
      when p_sale->>'qualification_status' = 'verified'
        and (lower(v_kpi_unit) like '%kes%'
          or lower(v_kpi_unit) like '%account%'
          or lower(v_kpi_unit) like '%merchant%'
          or lower(v_kpi_unit) like '%qualified accounts%') then v_actual_value
      else coalesce((p_sale->>'qualified_value')::numeric, 0)
    end;

    insert into public.banking_customer_sales (
      user_id, contract_id, kpi_id, sale_date, customer_name, customer_reference,
      product_name, product_status, amount, quantity, actual_value, qualified_value,
      qualification_status, evidence_reference, notes
    ) values (
      v_user_id, p_contract_id, p_kpi_id,
      coalesce((p_sale->>'sale_date')::date, current_date),
      trim(coalesce(p_sale->>'customer_name', '')),
      nullif(trim(p_sale->>'customer_reference'), ''),
      trim(coalesce(p_sale->>'product_name', '')),
      coalesce(p_sale->>'product_status', 'sold'),
      coalesce((p_sale->>'amount')::numeric, 0),
      coalesce((p_sale->>'quantity')::numeric, 1),
      v_actual_value,
      v_qualified_value,
      coalesce(p_sale->>'qualification_status', 'pending'),
      nullif(trim(p_sale->>'evidence_reference'), ''),
      nullif(trim(p_sale->>'notes'), '')
    ) returning * into v_sale;

    insert into public.banking_performance_evidence (
      source_sale_id, contract_id, kpi_id, user_id, evidence_date, evidence_type,
      reference_text, amount, status, notes
    ) values (
      v_sale.id, v_sale.contract_id, v_sale.kpi_id, v_user_id, v_sale.sale_date,
      'customer sale record',
      v_sale.customer_name || ' — ' || v_sale.product_name || ': ' ||
        coalesce(v_sale.evidence_reference, 'Customer sale ledger record'),
      v_sale.amount, v_sale.qualification_status, v_sale.notes
    ) on conflict (source_sale_id) where source_sale_id is not null do update set
      evidence_date = excluded.evidence_date,
      evidence_type = excluded.evidence_type,
      reference_text = excluded.reference_text,
      amount = excluded.amount,
      status = excluded.status,
      notes = excluded.notes,
      updated_at = now();

    v_week_start := v_sale.sale_date - (extract(isodow from v_sale.sale_date)::integer - 1);
    perform public.banking_rebuild_weekly_scorecard(p_contract_id, v_user_id, v_week_start);
    return jsonb_build_object('sale', to_jsonb(v_sale), 'week_start', v_week_start, 'week_end', v_week_start + 6);
  end if;

  if p_operation = 'update' then
    if p_sale_id is null then
      raise exception 'Sale ID is required' using errcode = '22023';
    end if;
    select * into v_sale
    from public.banking_customer_sales
    where id = p_sale_id and contract_id = p_contract_id and user_id = v_user_id
    for update;
    if not found then
      raise exception 'Customer sale was not found for this user and contract' using errcode = 'P0002';
    end if;

    v_old_week_start := v_sale.sale_date - (extract(isodow from v_sale.sale_date)::integer - 1);
    v_kpi_id := coalesce(p_kpi_id, v_sale.kpi_id);
    if not exists (
      select 1 from public.banking_contract_kpis k
      where k.id = v_kpi_id and k.contract_id = p_contract_id
        and k.user_id = v_user_id and k.active = true
    ) then
      raise exception 'KPI is not active for the selected contract' using errcode = '42501';
    end if;
    select k.unit into v_kpi_unit
    from public.banking_contract_kpis k
    where k.id = v_kpi_id and k.contract_id = p_contract_id and k.user_id = v_user_id;

    v_actual_value := case
      when lower(v_kpi_unit) like '%kes%' then coalesce((p_sale->>'amount')::numeric, v_sale.amount)
      when lower(v_kpi_unit) like '%account%'
        or lower(v_kpi_unit) like '%merchant%'
        or lower(v_kpi_unit) like '%qualified accounts%' then coalesce((p_sale->>'quantity')::numeric, v_sale.quantity)
      else coalesce((p_sale->>'actual_value')::numeric, v_sale.actual_value)
    end;
    v_qualified_value := case
      when coalesce(p_sale->>'qualification_status', v_sale.qualification_status) = 'verified'
        and (lower(v_kpi_unit) like '%kes%'
          or lower(v_kpi_unit) like '%account%'
          or lower(v_kpi_unit) like '%merchant%'
          or lower(v_kpi_unit) like '%qualified accounts%') then v_actual_value
      else coalesce((p_sale->>'qualified_value')::numeric, v_sale.qualified_value)
    end;

    update public.banking_customer_sales
    set kpi_id = v_kpi_id,
        sale_date = coalesce((p_sale->>'sale_date')::date, v_sale.sale_date),
        customer_name = trim(coalesce(p_sale->>'customer_name', v_sale.customer_name)),
        customer_reference = nullif(trim(coalesce(p_sale->>'customer_reference', v_sale.customer_reference)), ''),
        product_name = trim(coalesce(p_sale->>'product_name', v_sale.product_name)),
        product_status = coalesce(p_sale->>'product_status', v_sale.product_status),
        amount = coalesce((p_sale->>'amount')::numeric, v_sale.amount),
        quantity = coalesce((p_sale->>'quantity')::numeric, v_sale.quantity),
        actual_value = v_actual_value,
        qualified_value = v_qualified_value,
        qualification_status = coalesce(p_sale->>'qualification_status', v_sale.qualification_status),
        evidence_reference = nullif(trim(coalesce(p_sale->>'evidence_reference', v_sale.evidence_reference)), ''),
        notes = nullif(trim(coalesce(p_sale->>'notes', v_sale.notes)), '')
    where id = v_sale.id
    returning * into v_sale;

    update public.banking_performance_evidence
    set kpi_id = v_sale.kpi_id,
        evidence_date = v_sale.sale_date,
        reference_text = v_sale.customer_name || ' — ' || v_sale.product_name || ': ' ||
          coalesce(v_sale.evidence_reference, 'Customer sale ledger record'),
        amount = v_sale.amount,
        status = v_sale.qualification_status,
        notes = v_sale.notes,
        updated_at = now()
    where source_sale_id = v_sale.id and user_id = v_user_id;

    v_new_week_start := v_sale.sale_date - (extract(isodow from v_sale.sale_date)::integer - 1);
    perform public.banking_rebuild_weekly_scorecard(p_contract_id, v_user_id, v_old_week_start);
    if v_new_week_start <> v_old_week_start then
      perform public.banking_rebuild_weekly_scorecard(p_contract_id, v_user_id, v_new_week_start);
    end if;
    return jsonb_build_object('sale', to_jsonb(v_sale), 'week_start', v_new_week_start, 'week_end', v_new_week_start + 6);
  end if;

  if p_operation = 'qualify' then
    if p_sale_id is null or p_qualification_status is null or p_qualified_value is null then
      raise exception 'Sale ID, qualification status, and qualified value are required' using errcode = '22023';
    end if;
    select * into v_sale from public.banking_customer_sales
    where id = p_sale_id and contract_id = p_contract_id and user_id = v_user_id for update;
    if not found then raise exception 'Customer sale was not found for this user and contract' using errcode = 'P0002'; end if;
    update public.banking_customer_sales
    set qualification_status = p_qualification_status, qualified_value = p_qualified_value
    where id = v_sale.id returning * into v_sale;
    update public.banking_performance_evidence
    set status = v_sale.qualification_status, amount = v_sale.amount,
        updated_at = now()
    where source_sale_id = v_sale.id and user_id = v_user_id;
    v_week_start := v_sale.sale_date - (extract(isodow from v_sale.sale_date)::integer - 1);
    perform public.banking_rebuild_weekly_scorecard(p_contract_id, v_user_id, v_week_start);
    return jsonb_build_object('sale', to_jsonb(v_sale), 'week_start', v_week_start, 'week_end', v_week_start + 6);
  end if;

  if p_operation = 'delete' then
    if p_sale_id is null then raise exception 'Sale ID is required' using errcode = '22023'; end if;
    select * into v_sale from public.banking_customer_sales
    where id = p_sale_id and contract_id = p_contract_id and user_id = v_user_id for update;
    if not found then raise exception 'Customer sale was not found for this user and contract' using errcode = 'P0002'; end if;
    v_week_start := v_sale.sale_date - (extract(isodow from v_sale.sale_date)::integer - 1);
    delete from public.banking_performance_evidence where source_sale_id = v_sale.id and user_id = v_user_id;
    delete from public.banking_customer_sales where id = v_sale.id and user_id = v_user_id;
    perform public.banking_rebuild_weekly_scorecard(p_contract_id, v_user_id, v_week_start);
    return jsonb_build_object('deleted', true, 'sale', to_jsonb(v_sale), 'week_start', v_week_start, 'week_end', v_week_start + 6);
  end if;

  if not v_is_admin then
    raise exception 'Admin role is required for test-entry cleanup' using errcode = '42501';
  end if;

  select coalesce(array_agg(distinct sale_date - (extract(isodow from sale_date)::integer - 1)), '{}'::date[])
  into v_week_starts
  from public.banking_customer_sales
  where contract_id = p_contract_id and user_id = v_user_id
    and (
      customer_name = 'SAMPLE TEST'
      or customer_name ~* '(^|[^a-z])test([^a-z]|$)'
      or customer_reference ~* '(^|[^a-z])test([^a-z]|$)'
      or evidence_reference ~* '(^|[^a-z])test([^a-z]|$)'
      or notes ~* '(^|[^a-z])test([^a-z]|$)'
    );

  delete from public.banking_performance_evidence e
  where e.user_id = v_user_id and e.contract_id = p_contract_id
    and e.source_sale_id in (
      select s.id from public.banking_customer_sales s
      where s.contract_id = p_contract_id and s.user_id = v_user_id
        and (s.customer_name = 'SAMPLE TEST' or s.customer_name ~* '(^|[^a-z])test([^a-z]|$)'
          or s.customer_reference ~* '(^|[^a-z])test([^a-z]|$)'
          or s.evidence_reference ~* '(^|[^a-z])test([^a-z]|$)'
          or s.notes ~* '(^|[^a-z])test([^a-z]|$)')
    );
  delete from public.banking_customer_sales s
  where s.contract_id = p_contract_id and s.user_id = v_user_id
    and (s.customer_name = 'SAMPLE TEST' or s.customer_name ~* '(^|[^a-z])test([^a-z]|$)'
      or s.customer_reference ~* '(^|[^a-z])test([^a-z]|$)'
      or s.evidence_reference ~* '(^|[^a-z])test([^a-z]|$)'
      or s.notes ~* '(^|[^a-z])test([^a-z]|$)');
  get diagnostics v_deleted_count = row_count;

  foreach v_week_start in array v_week_starts loop
    perform public.banking_rebuild_weekly_scorecard(p_contract_id, v_user_id, v_week_start);
  end loop;
  return jsonb_build_object('deleted_count', v_deleted_count, 'week_starts', to_jsonb(v_week_starts));
end;
$$;

revoke all on function public.banking_customer_sales_atomic_sync(text, uuid, uuid, jsonb, uuid, text, numeric) from public, anon;
grant execute on function public.banking_customer_sales_atomic_sync(text, uuid, uuid, jsonb, uuid, text, numeric) to authenticated;
