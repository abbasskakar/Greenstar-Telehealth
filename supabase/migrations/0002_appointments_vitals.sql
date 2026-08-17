-- =====================================================================
-- Greenstar Telehealth — Appointments & Vitals (0002)
-- =====================================================================

do $$ begin
  create type appointment_type as enum ('emergency','regular');
exception when duplicate_object then null; end $$;

do $$ begin
  create type appointment_status as enum
    ('pending','claimed','in_consult','completed','cancelled');
exception when duplicate_object then null; end $$;

-- ---------- appointments ----------
create table if not exists appointments (
  id                 uuid primary key default gen_random_uuid(),
  patient_id         uuid not null references patients(id) on delete cascade,
  created_by         uuid references profiles(id) on delete set null,
  type               appointment_type   not null default 'regular',
  specialty          text,
  status             appointment_status not null default 'pending',
  assigned_doctor_id uuid references profiles(id) on delete set null,
  chief_complaint    text,
  geo_lat            double precision,
  geo_lng            double precision,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

drop trigger if exists trg_appt_updated on appointments;
create trigger trg_appt_updated before update on appointments
  for each row execute function set_updated_at();

create index if not exists idx_appt_status     on appointments(status);
create index if not exists idx_appt_created_by on appointments(created_by);
create index if not exists idx_appt_doctor     on appointments(assigned_doctor_id);
create index if not exists idx_appt_patient     on appointments(patient_id);
create index if not exists idx_appt_created_at on appointments(created_at desc);

-- ---------- vitals ----------
create table if not exists vitals (
  id             uuid primary key default gen_random_uuid(),
  patient_id     uuid not null references patients(id) on delete cascade,
  appointment_id uuid references appointments(id) on delete cascade,
  bp_systolic    int,
  bp_diastolic   int,
  heart_rate     int,
  temperature_f  numeric(4,1),
  spo2           int,
  hemoglobin     numeric(4,1),
  blood_sugar    int,
  captured_by    uuid references profiles(id) on delete set null,
  captured_at    timestamptz not null default now()
);

create index if not exists idx_vitals_patient on vitals(patient_id);
create index if not exists idx_vitals_appt    on vitals(appointment_id);

-- ---------- RLS ----------
alter table appointments enable row level security;
alter table vitals       enable row level security;

-- appointments: staff clinicians see the queue; owners see their own
drop policy if exists appt_select on appointments;
create policy appt_select on appointments for select using (
  auth_role() in ('admin','program_manager','doctor')
  or created_by = auth.uid()
  or assigned_doctor_id = auth.uid()
  or exists (
    select 1 from patients pt
    where pt.id = appointments.patient_id and pt.owner_id = auth.uid()
  )
);

drop policy if exists appt_insert on appointments;
create policy appt_insert on appointments for insert with check (
  created_by = auth.uid() and auth_role() in ('provider','public','admin')
);

drop policy if exists appt_update on appointments;
create policy appt_update on appointments for update using (
  auth_role() in ('admin','doctor') or created_by = auth.uid()
);

-- vitals: visible to anyone who can see the linked appointment
drop policy if exists vitals_select on vitals;
create policy vitals_select on vitals for select using (
  auth_role() in ('admin','program_manager','doctor')
  or captured_by = auth.uid()
  or exists (
    select 1 from appointments a
    where a.id = vitals.appointment_id
      and (a.created_by = auth.uid() or a.assigned_doctor_id = auth.uid())
  )
);

drop policy if exists vitals_insert on vitals;
create policy vitals_insert on vitals for insert with check (
  captured_by = auth.uid()
);
