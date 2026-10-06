-- Banking Growth Phase 2 foundation
-- Establishes business scoping for the existing Banking Acquisition slice and
-- creates the reusable institution profile + configurable product catalog.
-- No production data is inserted by this migration.

alter table public.banking_employers
  add column if not exists business_id uuid references public.businesses(id) on delete restrict;

alter table public.banking_recruitment_signals
  add column if not exists business_id uuid references public.businesses(id) on delete restrict;

alter table public.banking_employee_prospects
  add column if not exists business_id uuid references public.businesses(id) on delete restrict;

-- These tables currently contain zero rows in the verified live schema, so the
-- Banking Acquisition slice can adopt a required business owner immediately.
alter table public.banking_employers
  alter column business_id set not null;

alter table public.banking_recruitment_signals
  alter column business_id set not null;

alter table public.banking_employee_prospects
  alter column business_id set not null;

alter table public.banking_employers
  add constraint banking_employers_id_business_unique unique (id, business_id);

alter table public.banking_recruitment_signals
  add constraint banking_signals_employer_business_fkey
  foreign key (employer_id, business_id)
  references public.banking_employers (id, business_id)
  on delete cascade;

alter table public.banking_employee_prospects
  add constraint banking_prospects_employer_business_fkey
  foreign key (employer_id, business_id)
  references public.banking_employers (id, business_id)
  on delete cascade;

create index if not exists banking_employers_business_priority_idx
  on public.banking_employers (business_id, priority, hiring_momentum_score desc);

create index if not exists banking_signals_business_status_idx
  on public.banking_recruitment_signals (business_id, status, detected_at desc);

create index if not exists banking_prospects_business_stage_idx
  on public.banking_employee_prospects (business_id, stage, created_at desc);

create table if not exists public.banking_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete restrict,
  institution_name text not null,
  institution_code text,
  role_title text,
  currency text not null default 'KES',
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id)
);

create index if not exists banking_profiles_user_business_idx
  on public.banking_profiles (user_id, business_id);

create table if not exists public.banking_products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete restrict,
  code text not null,
  name text not null,
  category text not null,
  description text,
  target_segment text,
  eligibility_summary text,
  min_amount numeric(18,2),
  max_amount numeric(18,2),
  min_term_months integer,
  max_term_months integer,
  max_financing_percent numeric(6,2),
  rate_label text,
  source_url text,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, code),
  check (min_amount is null or min_amount >= 0),
  check (max_amount is null or max_amount >= 0),
  check (min_term_months is null or min_term_months >= 0),
  check (max_term_months is null or max_term_months >= 0),
  check (max_financing_percent is null or (max_financing_percent >= 0 and max_financing_percent <= 100))
);

create index if not exists banking_products_business_active_idx
  on public.banking_products (business_id, active, sort_order, name);

create or replace function public.banking_growth_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists banking_profiles_updated_at on public.banking_profiles;
create trigger banking_profiles_updated_at
  before update on public.banking_profiles
  for each row execute function public.banking_growth_set_updated_at();

drop trigger if exists banking_products_updated_at on public.banking_products;
create trigger banking_products_updated_at
  before update on public.banking_products
  for each row execute function public.banking_growth_set_updated_at();

alter table public.banking_profiles enable row level security;
alter table public.banking_products enable row level security;

drop policy if exists "banking employers owner access" on public.banking_employers;
drop policy if exists "banking signals owner access" on public.banking_recruitment_signals;
drop policy if exists "banking prospects owner access" on public.banking_employee_prospects;

create policy "banking employers business select"
  on public.banking_employers for select to authenticated
  using (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.businesses b
      where b.id = business_id and b.user_id = (select auth.uid())
    )
  );

create policy "banking employers business insert"
  on public.banking_employers for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.businesses b
      where b.id = business_id and b.user_id = (select auth.uid())
    )
  );

create policy "banking employers business update"
  on public.banking_employers for update to authenticated
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

create policy "banking employers business delete"
  on public.banking_employers for delete to authenticated
  using (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.businesses b
      where b.id = business_id and b.user_id = (select auth.uid())
    )
  );

create policy "banking signals business select"
  on public.banking_recruitment_signals for select to authenticated
  using (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.businesses b
      where b.id = business_id and b.user_id = (select auth.uid())
    )
  );

create policy "banking signals business insert"
  on public.banking_recruitment_signals for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.businesses b
      where b.id = business_id and b.user_id = (select auth.uid())
    )
  );

create policy "banking signals business update"
  on public.banking_recruitment_signals for update to authenticated
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

create policy "banking signals business delete"
  on public.banking_recruitment_signals for delete to authenticated
  using (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.businesses b
      where b.id = business_id and b.user_id = (select auth.uid())
    )
  );

create policy "banking prospects business select"
  on public.banking_employee_prospects for select to authenticated
  using (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.businesses b
      where b.id = business_id and b.user_id = (select auth.uid())
    )
  );

create policy "banking prospects business insert"
  on public.banking_employee_prospects for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.businesses b
      where b.id = business_id and b.user_id = (select auth.uid())
    )
  );

create policy "banking prospects business update"
  on public.banking_employee_prospects for update to authenticated
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

create policy "banking prospects business delete"
  on public.banking_employee_prospects for delete to authenticated
  using (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.businesses b
      where b.id = business_id and b.user_id = (select auth.uid())
    )
  );

create policy "banking profiles business select"
  on public.banking_profiles for select to authenticated
  using (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.businesses b
      where b.id = business_id and b.user_id = (select auth.uid())
    )
  );

create policy "banking profiles business insert"
  on public.banking_profiles for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.businesses b
      where b.id = business_id and b.user_id = (select auth.uid())
    )
  );

create policy "banking profiles business update"
  on public.banking_profiles for update to authenticated
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

create policy "banking profiles business delete"
  on public.banking_profiles for delete to authenticated
  using (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.businesses b
      where b.id = business_id and b.user_id = (select auth.uid())
    )
  );

create policy "banking products business select"
  on public.banking_products for select to authenticated
  using (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.businesses b
      where b.id = business_id and b.user_id = (select auth.uid())
    )
  );

create policy "banking products business insert"
  on public.banking_products for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.businesses b
      where b.id = business_id and b.user_id = (select auth.uid())
    )
  );

create policy "banking products business update"
  on public.banking_products for update to authenticated
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

create policy "banking products business delete"
  on public.banking_products for delete to authenticated
  using (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.businesses b
      where b.id = business_id and b.user_id = (select auth.uid())
    )
  );

grant select, insert, update, delete on public.banking_profiles to authenticated;
grant select, insert, update, delete on public.banking_products to authenticated;

comment on table public.banking_profiles is
  'Business-scoped banking institution configuration. Institution terms are configurable and not hard-coded into business logic.';

comment on table public.banking_products is
  'Business-scoped configurable banking product catalog. Eligibility, pricing and financing terms are data, not hard-coded rules.';
