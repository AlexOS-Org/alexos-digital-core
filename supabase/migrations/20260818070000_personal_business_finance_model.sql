-- AlexOS financial operating model
-- Adds explicit business ownership, structured income/expense classifications,
-- business links, and user-owned assets without changing existing data semantics.
-- Empty-data safe: all new foreign keys are nullable and existing rows remain valid.

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  slug text not null,
  business_type text,
  status text not null default 'active' check (status in ('active','paused','archived')),
  description text,
  logo_url text,
  cover_image_url text,
  currency text not null default 'KES',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, slug)
);

alter table public.businesses enable row level security;

create index if not exists businesses_user_id_idx on public.businesses(user_id);

create policy "Users can view their own businesses"
  on public.businesses for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their own businesses"
  on public.businesses for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own businesses"
  on public.businesses for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own businesses"
  on public.businesses for delete
  to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.businesses to authenticated;

-- Structured classification for real-world personal and business money flows.
alter table public.transactions
  add column if not exists business_id uuid references public.businesses(id),
  add column if not exists income_type text,
  add column if not exists expense_type text,
  add column if not exists marketing_campaign_id uuid references public.marketing_campaigns(id);

alter table public.accounts
  add column if not exists business_id uuid references public.businesses(id);

alter table public.debts
  add column if not exists business_id uuid references public.businesses(id);

alter table public.budgets
  add column if not exists business_id uuid references public.businesses(id);

alter table public.expected_money
  add column if not exists business_id uuid references public.businesses(id);

alter table public.marketing_campaigns
  add column if not exists business_id uuid references public.businesses(id);

alter table public.ad_creatives
  add column if not exists business_id uuid references public.businesses(id);

create index if not exists transactions_business_id_idx on public.transactions(business_id);
create index if not exists transactions_marketing_campaign_id_idx on public.transactions(marketing_campaign_id);
create index if not exists accounts_business_id_idx on public.accounts(business_id);
create index if not exists debts_business_id_idx on public.debts(business_id);
create index if not exists budgets_business_id_idx on public.budgets(business_id);
create index if not exists expected_money_business_id_idx on public.expected_money(business_id);
create index if not exists marketing_campaigns_business_id_idx on public.marketing_campaigns(business_id);
create index if not exists ad_creatives_business_id_idx on public.ad_creatives(business_id);

alter table public.transactions
  add constraint transactions_income_type_check check (
    income_type is null or income_type in (
      'sales_revenue',
      'salary',
      'commission',
      'business_profit',
      'personal_deal',
      'gift',
      'investment',
      'refund',
      'other'
    )
  );

alter table public.transactions
  add constraint transactions_expense_type_check check (
    expense_type is null or expense_type in (
      'cost_of_goods',
      'packaging',
      'delivery',
      'logistics',
      'advertising',
      'platform_fee',
      'supplier',
      'payroll',
      'rent',
      'utilities',
      'tax',
      'debt_payment',
      'interest',
      'personal_living',
      'education',
      'health',
      'transport',
      'other'
    )
  );

-- Assets are separate from cash accounts so Net Worth can eventually represent
-- cash + owned assets + receivables/expected money - outstanding liabilities.
create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_id uuid references public.businesses(id) on delete set null,
  name text not null,
  asset_type text not null check (asset_type in (
    'cash_equivalent',
    'inventory',
    'vehicle',
    'equipment',
    'property',
    'investment',
    'receivable',
    'other'
  )),
  value numeric not null default 0 check (value >= 0),
  valuation_date date not null default current_date,
  notes text,
  status text not null default 'active' check (status in ('active','disposed','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.assets enable row level security;

create index if not exists assets_user_id_idx on public.assets(user_id);
create index if not exists assets_business_id_idx on public.assets(business_id);

create policy "Users can view their own assets"
  on public.assets for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their own assets"
  on public.assets for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own assets"
  on public.assets for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own assets"
  on public.assets for delete
  to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.assets to authenticated;

-- A read-only business P&L source. It intentionally excludes loans from income
-- and debt payments from operating expenses, matching AlexOS financial semantics.
create or replace view public.business_financial_summary
with (security_invoker = true)
as
select
  t.user_id,
  t.business_id,
  date_trunc('month', t.occurred_at)::date as month,
  coalesce(sum(t.amount) filter (
    where t.type = 'income'
      and t.status = 'posted'
      and t.flow_type <> 'loan_received'
  ), 0) as income,
  coalesce(sum(t.amount) filter (
    where t.type = 'expense'
      and t.status = 'posted'
      and t.flow_type <> 'debt_payment'
  ), 0) as expenses,
  coalesce(sum(t.amount) filter (
    where t.type = 'income'
      and t.status = 'posted'
      and t.flow_type <> 'loan_received'
  ), 0)
  - coalesce(sum(t.amount) filter (
    where t.type = 'expense'
      and t.status = 'posted'
      and t.flow_type <> 'debt_payment'
  ), 0) as operating_profit
from public.transactions t
where t.business_id is not null
  and t.deleted_at is null
group by t.user_id, t.business_id, date_trunc('month', t.occurred_at)::date;

grant select on public.business_financial_summary to authenticated;

comment on table public.businesses is 'AlexOS businesses owned by a user; the business dimension for money, marketing and operations.';
comment on column public.transactions.income_type is 'Structured income source: sales, salary, commission, business profit/distribution, personal deal, gift, investment, refund or other.';
comment on column public.transactions.expense_type is 'Structured expense purpose including COGS, packaging, delivery/logistics, advertising, platform fees and personal living costs.';
comment on column public.transactions.business_id is 'Optional business owner of the transaction. Personal transactions leave this null.';
comment on table public.assets is 'User-owned assets used in AlexOS Net Worth beyond account cash balances and debts.';
