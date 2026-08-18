-- =====================================================================
-- Greenstar Telehealth — Reliability, audit, metrics, security (0010)
-- =====================================================================

-- ---------- Response-time timestamps ----------
alter table appointments add column if not exists claimed_at      timestamptz;
alter table appointments add column if not exists call_started_at timestamptz;
alter table appointments add column if not exists completed_at    timestamptz;

-- Stamp lifecycle timestamps automatically on status change
create or replace function stamp_appointment_status()
returns trigger language plpgsql as $$
begin
  if new.status = 'claimed'    and old.status <> 'claimed'    and new.claimed_at is null then
    new.claimed_at := now();
  end if;
  if new.status = 'in_consult' and old.status <> 'in_consult' and new.call_started_at is null then
    new.call_started_at := now();
  end if;
  if new.status = 'completed'  and old.status <> 'completed' then
    new.completed_at := now();
  end if;
  return new;
end $$;
drop trigger if exists trg_stamp_status on appointments;
create trigger trg_stamp_status before update on appointments
  for each row execute function stamp_appointment_status();

-- Notify the case owner when status changes (🟡 status update)
create or replace function notify_status_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status <> old.status and new.created_by is not null then
    insert into notifications (user_id, type, title, body, appointment_id)
    values (new.created_by, 'status',
            'Appointment ' || replace(new.status::text, '_', ' '),
            'The status of your appointment was updated.', new.id);
  end if;
  return new;
end $$;
drop trigger if exists trg_notify_status on appointments;
create trigger trg_notify_status after update on appointments
  for each row execute function notify_status_change();

-- ---------- MRN (human-friendly medical record number) ----------
create sequence if not exists mrn_seq start 1001;
create or replace function set_mrn()
returns trigger language plpgsql as $$
begin
  if new.mrn is null then
    new.mrn := 'GS-' || lpad(nextval('mrn_seq')::text, 6, '0');
  end if;
  return new;
end $$;
drop trigger if exists trg_set_mrn on patients;
create trigger trg_set_mrn before insert on patients
  for each row execute function set_mrn();

-- ---------- Audit logging (generic trigger) ----------
create or replace function audit_row()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  eid text;
begin
  eid := coalesce((case when tg_op = 'DELETE' then old.id else new.id end)::text, null);
  insert into audit_log (actor_id, action, entity, entity_id, meta)
  values (
    auth.uid(),
    lower(tg_op),
    tg_table_name,
    eid,
    case
      when tg_op = 'UPDATE' then jsonb_build_object('status', to_jsonb(new)->>'status')
      else null
    end
  );
  return null;
end $$;

do $$
declare t text;
begin
  foreach t in array array['appointments','prescriptions','lab_requests','camps','patients']
  loop
    execute format('drop trigger if exists trg_audit on %I', t);
    execute format('create trigger trg_audit after insert or update or delete on %I for each row execute function audit_row()', t);
  end loop;
end $$;

-- ---------- Duty: last-active heartbeat (for auto-offline) ----------
alter table profiles add column if not exists last_active_at timestamptz;

-- ---------- Camp light stock ----------
alter table camps add column if not exists stock jsonb not null default '{}';  -- {item: {available, used}}
