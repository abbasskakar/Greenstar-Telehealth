-- =====================================================================
-- Audit: cover staff/user changes + attribute service-role admin actions (0019)
-- =====================================================================
-- Two problems fixed:
--  (1) `profiles` was never audited, so staff create/enable/disable/delete left
--      no trail — contradicting the Settings page promise.
--  (2) Writes made through the service-role client (admin user management,
--      GDPR erasure, provider add-patient, public signup) have a NULL auth.uid(),
--      so the generic trigger logged them as "System" with no actor.
--
-- Strategy: the DB trigger handles ordinary user-context writes (auth.uid()
-- present). Service-role writes are logged explicitly by the application with
-- the real actor (see lib/audit.ts). To avoid duplicate/unattributed rows, both
-- triggers now skip when auth.uid() is null.

-- Generic trigger: skip service-role writes (app logs those explicitly).
create or replace function audit_row()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  eid text;
begin
  if auth.uid() is null then
    return null;  -- service-role write; attributed audit written by the app
  end if;
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

-- Profiles trigger: audit meaningful changes only; skip heartbeat/duty/avatar
-- churn and service-role writes.
create or replace function audit_profile()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'UPDATE'
     and new.is_active is not distinct from old.is_active
     and new.role      is not distinct from old.role
     and new.full_name is not distinct from old.full_name then
    return null;  -- last_active_at / duty / avatar_url change — not audit-worthy
  end if;
  if auth.uid() is null then
    return null;  -- service-role admin write; attributed audit written by the app
  end if;
  insert into audit_log (actor_id, action, entity, entity_id, meta)
  values (
    auth.uid(),
    lower(tg_op),
    'profiles',
    coalesce((case when tg_op = 'DELETE' then old.id else new.id end)::text, null),
    case when tg_op = 'UPDATE'
      then jsonb_build_object('is_active', new.is_active, 'role', new.role)
      else null end
  );
  return null;
end $$;

drop trigger if exists trg_audit_profile on profiles;
create trigger trg_audit_profile after insert or update or delete on profiles
  for each row execute function audit_profile();
