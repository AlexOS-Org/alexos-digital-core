-- Atomically create multiple KPI/product rows for one customer.
create or replace function public.banking_customer_sales_atomic_batch_create(
  p_contract_id uuid,
  p_sale jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_item jsonb;
  v_sale public.banking_customer_sales%rowtype;
  v_kpi_id uuid;
  v_kpi_unit text;
  v_actual_value numeric;
  v_qualified_value numeric;
  v_week_start date;
  v_week_starts date[] := '{}'::date[];
  v_created_count integer := 0;
begin
  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.banking_performance_contracts c
    where c.id = p_contract_id and c.user_id = v_user_id
  ) then
    raise exception 'Contract is not owned by the authenticated user' using errcode = '42501';
  end if;
  if jsonb_typeof(p_sale->'items') <> 'array' or jsonb_array_length(p_sale->'items') = 0 then
    raise exception 'At least one product is required' using errcode = '22023';
  end if;

  for v_item in select value from jsonb_array_elements(p_sale->'items') loop
    v_kpi_id := (v_item->>'kpi_id')::uuid;
    if not exists (
      select 1 from public.banking_contract_kpis k
      where k.id = v_kpi_id and k.contract_id = p_contract_id
        and k.user_id = v_user_id and k.active = true
    ) then
      raise exception 'KPI is not active for one of the selected products' using errcode = '42501';
    end if;
    select k.unit into v_kpi_unit
    from public.banking_contract_kpis k
    where k.id = v_kpi_id and k.contract_id = p_contract_id and k.user_id = v_user_id;

    v_actual_value := case
      when lower(v_kpi_unit) like '%kes%' then coalesce((v_item->>'amount')::numeric, 0)
      when lower(v_kpi_unit) like '%account%'
        or lower(v_kpi_unit) like '%merchant%'
        or lower(v_kpi_unit) like '%qualified accounts%' then coalesce((v_item->>'quantity')::numeric, 1)
      else coalesce((v_item->>'actual_value')::numeric, 0)
    end;
    v_qualified_value := case
      when p_sale->>'qualification_status' = 'verified'
        and (lower(v_kpi_unit) like '%kes%'
          or lower(v_kpi_unit) like '%account%'
          or lower(v_kpi_unit) like '%merchant%'
          or lower(v_kpi_unit) like '%qualified accounts%') then v_actual_value
      else coalesce((v_item->>'qualified_value')::numeric, 0)
    end;

    insert into public.banking_customer_sales (
      user_id, contract_id, kpi_id, sale_date, customer_name, customer_reference,
      product_name, product_status, amount, quantity, actual_value, qualified_value,
      qualification_status, evidence_reference, notes
    ) values (
      v_user_id, p_contract_id, v_kpi_id,
      coalesce((p_sale->>'sale_date')::date, current_date),
      trim(coalesce(p_sale->>'customer_name', '')),
      nullif(trim(p_sale->>'customer_reference'), ''),
      trim(coalesce(v_item->>'product_name', '')),
      coalesce(p_sale->>'product_status', 'sold'),
      coalesce((v_item->>'amount')::numeric, 0),
      coalesce((v_item->>'quantity')::numeric, 1),
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
    );

    v_week_start := v_sale.sale_date - (extract(isodow from v_sale.sale_date)::integer - 1);
    if not (v_week_start = any(v_week_starts)) then
      v_week_starts := array_append(v_week_starts, v_week_start);
    end if;
    v_created_count := v_created_count + 1;
  end loop;

  foreach v_week_start in array v_week_starts loop
    perform public.banking_rebuild_weekly_scorecard(p_contract_id, v_user_id, v_week_start);
  end loop;
  return jsonb_build_object('created_count', v_created_count, 'week_starts', to_jsonb(v_week_starts));
end;
$$;

revoke all on function public.banking_customer_sales_atomic_batch_create(uuid, jsonb) from public, anon;
grant execute on function public.banking_customer_sales_atomic_batch_create(uuid, jsonb) to authenticated;
