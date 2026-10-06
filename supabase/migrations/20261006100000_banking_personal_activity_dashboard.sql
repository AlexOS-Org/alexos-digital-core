-- Personal Banking Activity & Performance dashboard foundation
-- Activities are user-owned and business-scoped; no production data is inserted.
alter table public.banking_employee_prospects
  add constraint banking_employee_prospects_id_business_unique unique (id, business_id);

create table if not exists public.banking_activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete restrict,
  prospect_id uuid,
  activity_type text not null,
  status text not null default 'completed',
  activity_date date not null default current_date,
  subject text not null,
  outcome text,
  notes text,
  follow_up_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (activity_type in ('call','visit','meeting','follow_up','lead_contacted','customer_conversation','application','referral','product_discussion','document_collection')),
  check (status in ('planned','completed','cancelled')),
  check (length(trim(subject)) between 2 and 160),
  foreign key (prospect_id, business_id)
    references public.banking_employee_prospects (id, business_id)
    on delete set null
);

create index if not exists banking_activity_business_date_idx
  on public.banking_activity_log (business_id, activity_date desc, created_at desc);
create index if not exists banking_activity_business_follow_up_idx
  on public.banking_activity_log (business_id, follow_up_at)
  where follow_up_at is not null and status <> 'cancelled';
create index if not exists banking_activity_business_type_idx
  on public.banking_activity_log (business_id, activity_type, status, activity_date desc);

create or replace function public.banking_activity_set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  if new.status = 'completed' and new.completed_at is null then
    new.completed_at = now();
  elsif new.status <> 'completed' then
    new.completed_at = null;
  end if;
  return new;
end;
$$;

drop trigger if exists banking_activity_updated_at on public.banking_activity_log;
create trigger banking_activity_updated_at
  before insert or update on public.banking_activity_log
  for each row execute function public.banking_activity_set_updated_at();

alter table public.banking_activity_log enable row level security;
create policy "banking activity business access"
  on public.banking_activity_log for all to authenticated
  using (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.businesses b
      where b.id = business_id and b.user_id = (select auth.uid())
    )
  )
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.businesses b
      where b.id = business_id and b.user_id = (select auth.uid())
    )
  );

grant select, insert, update, delete on public.banking_activity_log to authenticated;
comment on table public.banking_activity_log is
  'User-owned personal Banking activity log for calls, visits, meetings, follow-ups, applications and product conversations. Metrics are derived from recorded activities; no performance data is fabricated.';
