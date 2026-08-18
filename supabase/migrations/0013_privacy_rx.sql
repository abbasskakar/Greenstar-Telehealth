-- =====================================================================
-- Greenstar Telehealth — Privacy + prescription enhancements (0013)
-- =====================================================================

-- Masked-display helper + clinical allergies on the patient record
alter table patients add column if not exists cnic_last4 text;
alter table patients add column if not exists allergies text;

-- Admins can erase a patient (right-to-erasure); cascades to their
-- appointments/vitals/notes/etc. via existing on-delete-cascade FKs.
drop policy if exists patients_delete on patients;
create policy patients_delete on patients for delete using (auth_role() = 'admin');
