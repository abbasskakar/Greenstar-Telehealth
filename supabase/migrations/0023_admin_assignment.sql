-- =====================================================================
-- Admin-controlled assignment (0023)
-- =====================================================================
-- New workflow: appointments no longer go straight to a shared doctor queue.
-- They land as `pending` for the admin, who assigns a specific doctor (by
-- specialty) and, optionally, a nurse (a provider) to record vitals first.
--   pending  -> awaiting admin assignment
--   claimed  -> a doctor has been assigned (worked on by that doctor only)
-- A nurse assignment is tracked separately and does not change the status.

alter table appointments add column if not exists assigned_nurse_id   uuid references profiles(id) on delete set null;
alter table appointments add column if not exists assigned_nurse_name text;
create index if not exists idx_appt_nurse on appointments(assigned_nurse_id);

-- Doctors now see ONLY the cases assigned to them (not the whole queue); the
-- assigned nurse (a provider) sees the cases they must take vitals for.
drop policy if exists appt_select on appointments;
create policy appt_select on appointments for select using (
  auth_role() in ('admin','program_manager')
  or created_by = auth.uid()
  or assigned_doctor_id = auth.uid()
  or assigned_nurse_id = auth.uid()
);

-- Participant check (gates notes / prescriptions / labs / consent): a doctor or
-- nurse participates only in cases assigned to them.
create or replace function is_appt_participant(appt uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from appointments a
    where a.id = appt
      and (a.created_by = auth.uid()
           or a.assigned_doctor_id = auth.uid()
           or a.assigned_nurse_id = auth.uid()
           or auth_role() in ('admin','program_manager'))
  )
$$;
