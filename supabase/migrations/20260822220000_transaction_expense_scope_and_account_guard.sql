-- Make the spending flow explicit without changing the one-entry ledger model.
-- An expense still creates exactly one transaction and reduces only account_id.
alter table public.transactions
  add column if not exists expense_scope text not null default 'personal';

alter table public.transactions
  drop constraint if exists transactions_expense_scope_check;

alter table public.transactions
  add constraint transactions_expense_scope_check
  check (expense_scope in ('personal', 'business', 'shared'));

-- Prevent an expense from claiming business scope without a business dimension.
alter table public.transactions
  drop constraint if exists transactions_business_scope_requires_business_id;

alter table public.transactions
  add constraint transactions_business_scope_requires_business_id
  check (type <> 'expense' or expense_scope <> 'business' or business_id is not null);

alter table public.transactions
  drop constraint if exists transactions_expense_type_check;

alter table public.transactions
  add constraint transactions_expense_type_check
  check (expense_type is null or expense_type in (
    'cost_of_goods', 'packaging', 'delivery', 'logistics', 'advertising',
    'platform_fee', 'supplier', 'payroll', 'rent', 'utilities', 'tax',
    'debt_payment', 'interest', 'personal_living', 'education', 'health',
    'transport', 'airtime', 'other'
  ));

create index if not exists transactions_expense_scope_idx
  on public.transactions(user_id, expense_scope, occurred_at desc);

comment on column public.transactions.expense_scope is
  'User-entered spending scope: personal, business, or shared. Shared is an allocation label; the selected account remains the single cash source.';
