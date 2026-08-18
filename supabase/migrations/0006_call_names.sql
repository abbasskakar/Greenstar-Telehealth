-- Denormalise names onto the call so the provider (who can't read the
-- doctor's profile under RLS) can show them on the incoming-call screen.
alter table call_sessions add column if not exists doctor_name text;
alter table call_sessions add column if not exists patient_name text;
