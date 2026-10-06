-- Customer-level KCB product sales ledger.
-- One row represents one customer/product outcome and is the source for weekly scorecard sync.

create table if not exists public.banking_customer_sales (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  contract_id uuid not null references public.banking_performance_contracts(id) on delete cascade,
  kpi_id uuid not null references public.banking_contract_kpis(id) on delete restrict,
  sale_date date not null default current_date,
  customer_name text not null,
  customer_reference text,
  product_name text not null,
  product_status text not null default 'sold',
  amount numeric(18,4) not null default 0,
  quantity numeric(18,4) not null default 1,
  actual_value numeric(18,4) not null default 1,
  qualified_value numeric(18,4) not null default 0,
  qualification_status text not null default 'pending',
  evidence_reference text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (length(trim(customer_name)) between 2 and 160),
  check (length(trim(product_name)) between 2 and 160),
  check (product_status in ('lead','application','approved','sold','activated','funded','paid','rejected','cancelled')),
  check (amount >= 0),
  check (quantity >= 0),
  check (actual_value >= 0),
  check (qualified_value >= 0 and qualified_value <= actual_value),
  check (qualification_status in ('pending','verified','rejected'))
);

alter table public.banking_performance_evidence
  add column if not exists source_sale_id uuid references public.banking_customer_sales(id) on delete cascade;
create unique index if not exists banking_performance_evidence_source_sale_idx
  on public.banking_performance_evidence (source_sale_id)
  where source_sale_id is not null;

create index if not exists banking_customer_sales_user_date_idx
  on public.banking_customer_sales (user_id, sale_date desc, created_at desc);
create index if not exists banking_customer_sales_user_kpi_idx
  on public.banking_customer_sales (user_id, kpi_id, sale_date desc, qualification_status);

create or replace function public.banking_customer_sales_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end;
$$;
drop trigger if exists banking_customer_sales_updated_at on public.banking_customer_sales;
create trigger banking_customer_sales_updated_at before update on public.banking_customer_sales for each row execute function public.banking_customer_sales_updated_at();

alter table public.banking_customer_sales enable row level security;
create policy "banking customer sales personal access"
  on public.banking_customer_sales for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.banking_customer_sales to authenticated;
comment on table public.banking_customer_sales is
  'Customer-level KCB product outcomes. Verified qualified_value is aggregated into the weekly contract scorecard.';
