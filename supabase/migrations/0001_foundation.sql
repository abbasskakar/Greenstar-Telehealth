-- =====================================================================
-- Greenstar Telehealth — Foundation migration (0001)
-- Roles, profiles, patient registry, audit log, and Row-Level Security.
-- Run in Supabase → SQL Editor. Idempotent-ish (safe to re-run in dev).
-- =====================================================================

-- ---------- Extensions ----------
create extension if not exists pgcrypto;

-- ---------- Enums ----------
do $$ begin
  create type user_role as enum ('provider','doctor','admin','program_manager','public');
exception when duplicate_object then null; end $$;

do $$ begin
  create type duty_status as enum ('on_duty','off_duty');
exception when duplicate_object then null; end $$;

-- ---------- Helper: updated_at trigger ----------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- =====================================================================
-- profiles — extends Supabase auth.users with role + app data
-- =====================================================================
create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        user_role   not null default 'public',
  full_name   text        not null default '',
  username    text        unique,
  phone       text,
  specialty   text,
  duty        duty_status not null default 'off_duty',
  language    text        not null default 'en',
  is_active   boolean     not null default true,
  created_by  uuid        references profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists trg_profiles_updated on profiles;
create trigger trg_profiles_updated before update on profiles
  for each row execute function set_updated_at();

-- =====================================================================
-- patients — longitudinal record (one patient, many appointments)
-- =====================================================================
create table if not exists patients (
  id          uuid primary key default gen_random_uuid(),
  mrn         text unique,
  cnic_hash   text unique,          -- deterministic hash for uniqueness / lookup
  cnic_enc    text,                 -- encrypted CNIC (decrypted only server-side when authorised)
  full_name   text not null,
  dob         date,
  gender      text,
  contact     text,
  language    text not null default 'en',
  owner_id    uuid references profiles(id) on delete set null,  -- public user who "is" this patient
  created_by  uuid references profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists trg_patients_updated on patients;
create trigger trg_patients_updated before update on patients
  for each row execute function set_updated_at();

create index if not exists idx_patients_created_by on patients(created_by);
create index if not exists idx_patients_owner on patients(owner_id);

-- =====================================================================
-- audit_log — first-class from day one
-- =====================================================================
create table if not exists audit_log (
  id          bigint generated always as identity primary key,
  actor_id    uuid references profiles(id) on delete set null,
  action      text not null,
  entity      text not null,
  entity_id   text,
  meta        jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists idx_audit_actor on audit_log(actor_id);
create index if not exists idx_audit_created on audit_log(created_at desc);

-- =====================================================================
-- Role helper — reads the caller's role (security definer avoids RLS recursion)
-- =====================================================================
create or replace function auth_role()
returns user_role
language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid()
$$;

create or replace function is_staff()
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(auth_role() in ('admin','program_manager','doctor','provider'), false)
$$;

-- =====================================================================
-- New auth user -> auto-create a profile (role from signup metadata)
-- =====================================================================
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, role, full_name, username, phone, language)
  values (
    new.id,
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'public'),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    nullif(new.raw_user_meta_data->>'username', ''),
    new.raw_user_meta_data->>'phone',
    coalesce(new.raw_user_meta_data->>'language', 'en')
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- =====================================================================
-- Row-Level Security
-- =====================================================================
alter table profiles  enable row level security;
alter table patients  enable row level security;
alter table audit_log enable row level security;

-- profiles ------------------------------------------------------------
drop policy if exists profiles_select on profiles;
create policy profiles_select on profiles for select using (
  id = auth.uid() or auth_role() in ('admin','program_manager')
);

drop policy if exists profiles_update_self on profiles;
create policy profiles_update_self on profiles for update using (
  id = auth.uid() or auth_role() = 'admin'
) with check (
  id = auth.uid() or auth_role() = 'admin'
);

drop policy if exists profiles_admin_insert on profiles;
create policy profiles_admin_insert on profiles for insert with check (
  auth_role() = 'admin' or id = auth.uid()
);

-- patients ------------------------------------------------------------
drop policy if exists patients_select on patients;
create policy patients_select on patients for select using (
  auth_role() in ('admin','program_manager','doctor')
  or created_by = auth.uid()
  or owner_id = auth.uid()
);

drop policy if exists patients_insert on patients;
create policy patients_insert on patients for insert with check (
  auth_role() in ('provider','admin') or owner_id = auth.uid()
);

drop policy if exists patients_update on patients;
create policy patients_update on patients for update using (
  auth_role() in ('admin') or created_by = auth.uid() or owner_id = auth.uid()
);

-- audit_log -----------------------------------------------------------
drop policy if exists audit_select on audit_log;
create policy audit_select on audit_log for select using (
  auth_role() in ('admin','program_manager')
);

drop policy if exists audit_insert on audit_log;
create policy audit_insert on audit_log for insert with check (
  auth.uid() is not null
);
