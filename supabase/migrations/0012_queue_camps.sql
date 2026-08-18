-- =====================================================================
-- Greenstar Telehealth — Queue + camps enhancements (0012)
-- =====================================================================

-- Denormalised claiming-doctor name so other doctors see "handled by Dr ___"
-- (RLS prevents reading another doctor's profile row directly).
alter table appointments add column if not exists assigned_doctor_name text;
