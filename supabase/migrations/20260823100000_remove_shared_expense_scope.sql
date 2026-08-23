-- Normalize the legacy Shared scope into exactly one ledger classification.
-- This changes classification only; amounts, accounts, dates, references and transaction IDs remain unchanged.
begin;

update public.transactions
set expense_scope = case
  when business_id is not null then 'business'
  else 'personal'
end
where expense_scope = 'shared';

alter table public.transactions
  drop constraint if exists transactions_expense_scope_check;

alter table public.transactions
  add constraint transactions_expense_scope_check
  check (expense_scope in ('personal', 'business'));

comment on column public.transactions.expense_scope is
  'Single classification for spending: personal or business. Shared is not supported; common costs must be entered once and assigned to the chosen classification.';

commit;
