-- =====================================================================
-- Greenstar Telehealth — Camps & Community Events (0009)
-- =====================================================================

do $$ begin
  create type camp_type as enum
    ('health_camp','blood_donation','vaccination','awareness','other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type camp_status as enum ('scheduled','active','completed','cancelled');
exception when duplicate_object then null; end $$;

create table if not exists camps (
  id               uuid primary key default gen_random_uuid(),
  type             camp_type   not null default 'health_camp',
  title            text        not null,
  date_start       date        not null,
  date_end         date,
  location         text,
  geo_lat          double precision,
  geo_lng          double precision,
  team             text,
  expected_turnout int,
  actual_turnout   int,
  counters         jsonb not null default '{}',   -- {patients_seen, blood_units, vaccines, ...}
  photos           jsonb not null default '[]',   -- storage paths
  notes            text,
  status           camp_status not null default 'scheduled',
  created_by       uuid references profiles(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists idx_camps_date on camps(date_start desc);

drop trigger if exists trg_camps_updated on camps;
create trigger trg_camps_updated before update on camps
  for each row execute function set_updated_at();

-- link appointments to a camp
alter table appointments add column if not exists camp_id uuid references camps(id) on delete set null;
create index if not exists idx_appt_camp on appointments(camp_id);

-- RLS
alter table camps enable row level security;

drop policy if exists camps_select on camps;
create policy camps_select on camps for select using (
  auth_role() in ('admin','program_manager','provider','doctor')
);
drop policy if exists camps_insert on camps;
create policy camps_insert on camps for insert with check (
  auth_role() in ('admin','program_manager','provider')
);
drop policy if exists camps_update on camps;
create policy camps_update on camps for update using (
  auth_role() in ('admin','program_manager','provider')
);

-- camp photos storage
insert into storage.buckets (id, name, public)
values ('camp-photos', 'camp-photos', false)
on conflict (id) do nothing;

drop policy if exists "camp photos insert" on storage.objects;
create policy "camp photos insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'camp-photos');
drop policy if exists "camp photos select" on storage.objects;
create policy "camp photos select" on storage.objects for select to authenticated
  using (bucket_id = 'camp-photos');
