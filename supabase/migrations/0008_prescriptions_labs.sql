-- =====================================================================
-- Greenstar Telehealth — E-Prescriptions + Lab requests (0008)
-- =====================================================================

-- ---------- prescriptions ----------
create table if not exists prescriptions (
  id             uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references appointments(id) on delete cascade,
  patient_id     uuid references patients(id) on delete set null,
  doctor_id      uuid references profiles(id) on delete set null,
  doctor_name    text,
  specialty      text,
  items          jsonb not null default '[]',  -- [{drug,dose,frequency,duration,instructions}]
  advice         text,
  follow_up_date date,
  created_at     timestamptz not null default now()
);
create index if not exists idx_rx_appt    on prescriptions(appointment_id);
create index if not exists idx_rx_patient on prescriptions(patient_id, created_at desc);

-- ---------- lab requests ----------
create table if not exists lab_requests (
  id             uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references appointments(id) on delete cascade,
  patient_id     uuid references patients(id) on delete set null,
  doctor_id      uuid references profiles(id) on delete set null,
  doctor_name    text,
  tests          jsonb not null default '[]',  -- ["CBC","Blood Sugar",...]
  notes          text,
  status         text not null default 'requested',  -- requested | resulted
  result_note    text,
  result_files   jsonb not null default '[]',  -- storage paths
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists idx_lab_appt on lab_requests(appointment_id);

drop trigger if exists trg_lab_updated on lab_requests;
create trigger trg_lab_updated before update on lab_requests
  for each row execute function set_updated_at();

-- ---------- RLS ----------
alter table prescriptions enable row level security;
alter table lab_requests  enable row level security;

drop policy if exists rx_select on prescriptions;
create policy rx_select on prescriptions for select using (is_appt_participant(appointment_id));
drop policy if exists rx_insert on prescriptions;
create policy rx_insert on prescriptions for insert with check (
  doctor_id = auth.uid() and auth_role() = 'doctor'
);

drop policy if exists lab_select on lab_requests;
create policy lab_select on lab_requests for select using (is_appt_participant(appointment_id));
drop policy if exists lab_insert on lab_requests;
create policy lab_insert on lab_requests for insert with check (
  doctor_id = auth.uid() and auth_role() = 'doctor'
);
drop policy if exists lab_update on lab_requests;
create policy lab_update on lab_requests for update using (is_appt_participant(appointment_id));

-- ---------- Notify triggers ----------
create or replace function notify_on_prescription()
returns trigger language plpgsql security definer set search_path = public as $$
declare recipient uuid;
begin
  select created_by into recipient from appointments where id = new.appointment_id;
  if recipient is not null and recipient <> new.doctor_id then
    insert into notifications (user_id, type, title, body, appointment_id)
    values (recipient, 'prescription',
            'Prescription from ' || coalesce(new.doctor_name,'the doctor'),
            'A new prescription is ready to view.', new.appointment_id);
  end if;
  return new;
end $$;
drop trigger if exists trg_notify_rx on prescriptions;
create trigger trg_notify_rx after insert on prescriptions
  for each row execute function notify_on_prescription();

create or replace function notify_on_lab()
returns trigger language plpgsql security definer set search_path = public as $$
declare a record;
begin
  select created_by, assigned_doctor_id into a from appointments where id = new.appointment_id;
  if tg_op = 'INSERT' then
    if a.created_by is not null and a.created_by <> new.doctor_id then
      insert into notifications (user_id, type, title, body, appointment_id)
      values (a.created_by, 'prescription',
              'Lab requested by ' || coalesce(new.doctor_name,'the doctor'),
              'Please collect the sample / upload results.', new.appointment_id);
    end if;
  elsif tg_op = 'UPDATE' and new.status = 'resulted' and old.status <> 'resulted' then
    if a.assigned_doctor_id is not null then
      insert into notifications (user_id, type, title, body, appointment_id)
      values (a.assigned_doctor_id, 'prescription',
              'Lab results ready', 'Uploaded results are ready to review.', new.appointment_id);
    end if;
  end if;
  return new;
end $$;
drop trigger if exists trg_notify_lab on lab_requests;
create trigger trg_notify_lab after insert or update on lab_requests
  for each row execute function notify_on_lab();

-- ---------- Lab results storage ----------
insert into storage.buckets (id, name, public)
values ('lab-results', 'lab-results', false)
on conflict (id) do nothing;

drop policy if exists "lab results insert" on storage.objects;
create policy "lab results insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'lab-results');
drop policy if exists "lab results select" on storage.objects;
create policy "lab results select" on storage.objects for select to authenticated
  using (bucket_id = 'lab-results');
