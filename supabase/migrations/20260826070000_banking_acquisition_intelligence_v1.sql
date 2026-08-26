-- Banking Acquisition Intelligence v1
-- Isolated tables; does not alter existing CRM tables.

create table if not exists public.banking_employers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_name text not null,
  industry text,
  location text default 'Nairobi',
  employee_count integer,
  recruitment_frequency text not null default 'unknown' check (recruitment_frequency in ('unknown','occasional','regular','frequent','mass')),
  hiring_momentum_score integer not null default 0 check (hiring_momentum_score between 0 and 100),
  priority text not null default 'medium' check (priority in ('low','medium','high','hot')),
  hr_contact_name text,
  hr_contact_phone text,
  hr_contact_email text,
  notes text,
  last_hiring_signal_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists banking_employers_user_priority_idx on public.banking_employers(user_id, priority, hiring_momentum_score desc);

create table if not exists public.banking_recruitment_signals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  employer_id uuid not null references public.banking_employers(id) on delete cascade,
  signal_type text not null,
  title text not null,
  source_url text,
  detected_at timestamptz not null default now(),
  vacancy_count integer not null default 0,
  estimated_hires integer not null default 0,
  status text not null default 'new' check (status in ('new','reviewed','actioned','dismissed')),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists banking_signals_employer_date_idx on public.banking_recruitment_signals(employer_id, detected_at desc);
create index if not exists banking_signals_user_status_idx on public.banking_recruitment_signals(user_id, status, detected_at desc);

create table if not exists public.banking_employee_prospects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  employer_id uuid not null references public.banking_employers(id) on delete cascade,
  crm_contact_id uuid references public.contacts(id) on delete set null,
  first_name text not null,
  last_name text,
  phone text,
  email text,
  job_title text,
  estimated_salary numeric(14,2),
  stage text not null default 'identified' check (stage in ('identified','contacted','account_opened','salary_active','product_opportunity','converted','lost')),
  account_status text not null default 'not_started' check (account_status in ('not_started','application','opened','active')),
  consent_status text not null default 'unknown' check (consent_status in ('unknown','pending','granted','declined')),
  next_action_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists banking_prospects_employer_stage_idx on public.banking_employee_prospects(employer_id, stage);
create index if not exists banking_prospects_user_stage_idx on public.banking_employee_prospects(user_id, stage);

alter table public.banking_employers enable row level security;
alter table public.banking_recruitment_signals enable row level security;
alter table public.banking_employee_prospects enable row level security;

create policy "banking employers owner access" on public.banking_employers
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "banking signals owner access" on public.banking_recruitment_signals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "banking prospects owner access" on public.banking_employee_prospects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.banking_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists banking_employers_updated_at on public.banking_employers;
create trigger banking_employers_updated_at before update on public.banking_employers for each row execute function public.banking_set_updated_at();

drop trigger if exists banking_prospects_updated_at on public.banking_employee_prospects;
create trigger banking_prospects_updated_at before update on public.banking_employee_prospects for each row execute function public.banking_set_updated_at();
