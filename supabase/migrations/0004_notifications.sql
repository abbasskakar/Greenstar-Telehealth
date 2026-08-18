-- =====================================================================
-- Greenstar Telehealth — Real-time Notifications (0004)
-- =====================================================================

do $$ begin
  create type notification_type as enum
    ('emergency','regular','note','status','call','prescription');
exception when duplicate_object then null; end $$;

create table if not exists notifications (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references profiles(id) on delete cascade,
  type           notification_type not null,
  title          text not null,
  body           text,
  appointment_id uuid references appointments(id) on delete cascade,
  patient_name   text,
  read_at        timestamptz,
  created_at     timestamptz not null default now()
);

create index if not exists idx_notif_user   on notifications(user_id, created_at desc);
create index if not exists idx_notif_unread on notifications(user_id) where read_at is null;

alter table notifications enable row level security;

drop policy if exists notif_select on notifications;
create policy notif_select on notifications for select using (user_id = auth.uid());

drop policy if exists notif_update on notifications;
create policy notif_update on notifications for update using (user_id = auth.uid());

-- ---------- Auto-notify doctors when an appointment is created ----------
create or replace function notify_doctors_on_appointment()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  pname text;
  has_on_duty boolean;
begin
  select full_name into pname from patients where id = new.patient_id;
  select exists(select 1 from profiles where role='doctor' and is_active and duty='on_duty')
    into has_on_duty;

  insert into notifications (user_id, type, title, body, appointment_id, patient_name)
  select
    d.id,
    (case when new.type='emergency' then 'emergency' else 'regular' end)::notification_type,
    (case when new.type='emergency' then 'Emergency appointment' else 'New appointment' end),
    coalesce(new.specialty,'General')
      || case when new.chief_complaint is not null
              then ' — ' || left(new.chief_complaint, 90) else '' end,
    new.id,
    pname
  from profiles d
  where d.role='doctor' and d.is_active
    and (
      new.type <> 'emergency'      -- regular: all doctors
      or d.duty='on_duty'          -- emergency: on-duty doctors
      or not has_on_duty           -- ...but if none on duty, notify all (never drop an emergency)
    );

  return new;
end $$;

drop trigger if exists trg_notify_on_appt on appointments;
create trigger trg_notify_on_appt after insert on appointments
  for each row execute function notify_doctors_on_appointment();

-- ---------- Enable Supabase Realtime on the relevant tables ----------
do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname='supabase_realtime' and schemaname='public' and tablename='notifications'
  ) then
    alter publication supabase_realtime add table notifications;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname='supabase_realtime' and schemaname='public' and tablename='appointments'
  ) then
    alter publication supabase_realtime add table appointments;
  end if;
end $$;
