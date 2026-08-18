-- =====================================================================
-- Greenstar Telehealth — Clinical Notes + Consent (0007)
-- =====================================================================

do $$ begin
  create type note_kind as enum ('text','voice');
exception when duplicate_object then null; end $$;

-- ---------- notes (appointment-specific chat thread) ----------
create table if not exists notes (
  id             uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references appointments(id) on delete cascade,
  author_id      uuid references profiles(id) on delete set null,
  author_name    text,
  author_role    user_role,
  kind           note_kind not null default 'text',
  body           text,
  audio_path     text,
  duration_sec   int,
  created_at     timestamptz not null default now()
);
create index if not exists idx_notes_appt on notes(appointment_id, created_at);

-- ---------- consents ----------
create table if not exists consents (
  id             uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references appointments(id) on delete cascade,
  patient_id     uuid references patients(id) on delete set null,
  granted_by     uuid references profiles(id) on delete set null,
  granted_by_name text,
  method         text not null default 'verbal',
  note           text,
  created_at     timestamptz not null default now()
);
create index if not exists idx_consent_appt on consents(appointment_id);

-- ---------- RLS ----------
alter table notes    enable row level security;
alter table consents enable row level security;

-- Helper: is the caller a participant in the appointment?
create or replace function is_appt_participant(appt uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from appointments a
    where a.id = appt
      and (a.created_by = auth.uid()
           or a.assigned_doctor_id = auth.uid()
           or auth_role() in ('admin','program_manager','doctor'))
  )
$$;

drop policy if exists notes_select on notes;
create policy notes_select on notes for select using (is_appt_participant(appointment_id));
drop policy if exists notes_insert on notes;
create policy notes_insert on notes for insert with check (
  author_id = auth.uid() and is_appt_participant(appointment_id)
);

drop policy if exists consents_select on consents;
create policy consents_select on consents for select using (is_appt_participant(appointment_id));
drop policy if exists consents_insert on consents;
create policy consents_insert on consents for insert with check (
  granted_by = auth.uid() and is_appt_participant(appointment_id)
);

-- ---------- Notify the counterpart when a note is posted ----------
create or replace function notify_on_note()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  a record;
  recipient uuid;
begin
  select created_by, assigned_doctor_id into a from appointments where id = new.appointment_id;
  recipient := case when new.author_id = a.created_by then a.assigned_doctor_id else a.created_by end;
  if recipient is not null and recipient <> new.author_id then
    insert into notifications (user_id, type, title, body, appointment_id, patient_name)
    values (
      recipient, 'note',
      'New note from ' || coalesce(new.author_name, 'a colleague'),
      case when new.kind = 'voice' then '🎙 Voice note' else left(coalesce(new.body, ''), 90) end,
      new.appointment_id, new.author_name
    );
  end if;
  return new;
end $$;

drop trigger if exists trg_notify_note on notes;
create trigger trg_notify_note after insert on notes
  for each row execute function notify_on_note();

-- ---------- Realtime + voice storage ----------
do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname='supabase_realtime' and schemaname='public' and tablename='notes'
  ) then
    alter publication supabase_realtime add table notes;
  end if;
end $$;

insert into storage.buckets (id, name, public)
values ('voice-notes', 'voice-notes', false)
on conflict (id) do nothing;

drop policy if exists "voice notes insert" on storage.objects;
create policy "voice notes insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'voice-notes');
drop policy if exists "voice notes select" on storage.objects;
create policy "voice notes select" on storage.objects for select to authenticated
  using (bucket_id = 'voice-notes');
